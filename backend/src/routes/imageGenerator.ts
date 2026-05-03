import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { stripLoneSurrogates } from '../utils/sanitizeText';

const router = Router();

// The model defaults to the one the user requested; swap via env without redeploy.
// If `gpt-image-2` ever 404s on a given account, set OPENAI_IMAGE_MODEL=gpt-image-1
// and the same code keeps working.
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';

// Approximate caps so the route doesn't fall over on huge uploads. The OpenAI
// API has its own (~25MB) limit, but we want to fail fast before hitting it.
const MAX_DATA_URL_BYTES = 12 * 1024 * 1024; // 12 MB raw data URL string
const MAX_PROMPT_CHARS = 4000;

// Sizes accepted by gpt-image-* — we accept these three from the UI.
type SizeOption = '1024x1024' | '1024x1536' | '1536x1024';
const VALID_SIZES: SizeOption[] = ['1024x1024', '1024x1536', '1536x1024'];

function isDataUrl(s: unknown): s is string {
  return typeof s === 'string' && s.startsWith('data:image/') && s.includes(';base64,');
}

// Convert a `data:image/<mime>;base64,<payload>` string into a File the OpenAI
// SDK accepts via `images.edit`. Uses the SDK's `toFile` helper which handles
// node Buffer → File transparently.
async function dataUrlToFile(dataUrl: string, name: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  return toFile(buffer, name, { type: mime });
}

// Auto-detect when the user is asking for an image that NEEDS text in it.
// Without this we used to blanket-forbid text and the model would silently
// drop the user's "tweet that says X" intent in favour of a thematic collage.
function detectTextIntent(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return /\b(tweet|tuit|screenshot|captura\s+de|poster|cartel|letrero|sign|quote|cita|frase|mensaje|caption|subt[íi]tulo|t[íi]tulo|titular|headline|que\s+diga|that\s+says|with\s+the\s+text|con\s+el\s+texto|texto\s+que\s+diga|texto:|writes?\s+that|escribe\s+que|reads?\s+that)\b/.test(p);
}

// Compose the final prompt from the user's intent plus optional modifiers.
// We keep their prompt as the centerpiece and append style / palette / context
// as instructions the model can layer on top.
function buildPrompt(opts: {
  prompt: string;
  style?: string;
  palette?: string;
  hasLogo?: boolean;
  hasReference?: boolean;
  postContext?: string;
  // Caller can force text on/off; if undefined we auto-detect from the prompt.
  allowText?: boolean;
}): string {
  const parts: string[] = [opts.prompt.trim()];

  // Resolve the text policy first so downstream logic (postContext gating,
  // hard rules) can branch on it.
  const allowText = opts.allowText !== undefined ? opts.allowText : detectTextIntent(opts.prompt);

  if (opts.style?.trim()) {
    parts.push(`Visual style: ${opts.style.trim()}.`);
  }
  if (opts.palette?.trim()) {
    parts.push(
      `Color palette: ${opts.palette.trim()}. Make these colors visually dominant; avoid colors that clash with them.`
    );
  }
  if (opts.hasLogo) {
    parts.push(
      'A reference logo image is provided. Place that logo in the bottom-right corner of the composition at ~10% of the image width, with a small breathing margin. Do not invent or alter the logo — preserve it exactly as given.'
    );
  }
  if (opts.hasReference) {
    parts.push(
      'A reference image is also provided as a STYLE / COMPOSITION guide only. Do not copy its content; mirror its mood, lighting and layout patterns.'
    );
  }

  // Only inject postContext when the image is meant to ACCOMPANY the post
  // (no text in image). When the user asked for text-in-image, the post
  // context fights with their prompt and the model produces collages — see
  // the "tweet of an industrial outbound quote" failure case.
  if (!allowText && opts.postContext?.trim()) {
    parts.push(
      // 3000 covers a full LinkedIn post (their hard limit). The model treats
      // it as semantic background to inform mood / metaphor / subject — it
      // shouldn't try to render the post text inside the image.
      `The image accompanies this LinkedIn post. Use it as semantic context for what the image is ABOUT — the mood, the subject, the metaphor — but do NOT render literal text from the post in the image:\n"""\n${opts.postContext.trim().slice(0, 3000)}\n"""`
    );
  }

  // Text policy. Was a hard "no text ever" rule which broke "tweet that
  // says X" prompts; now it adapts to user intent.
  if (allowText) {
    parts.push(
      'Text policy: render the text from the user\'s prompt VERBATIM — preserve every word, accent and punctuation exactly as written. Type must be crisp and legible; no decorative or distorted lettering unless the prompt explicitly asks for it. Do not invent additional text beyond what the user specified.'
    );
  } else {
    parts.push(
      'Text policy: do NOT include any text, words, letters or numbers in the image (the LinkedIn post already carries the text).'
    );
  }

  // General quality rules — independent of the text policy.
  parts.push(
    'Avoid generic stock-photo aesthetics. Prefer specific, distinctive compositions over safe defaults.'
  );

  return parts.join('\n\n');
}

// POST /api/post-creator/generate-image
// Body: {
//   prompt: string                          // required, what to draw
//   style?: string                          // free text, e.g. "minimalist 3D illustration"
//   palette?: string                        // free text, e.g. "deep navy + warm coral"
//   size?: '1024x1024' | '1024x1536' | '1536x1024'
//   logoDataUrl?: string                    // base64 data URL for the logo
//   referenceDataUrl?: string               // base64 data URL for a style reference
//   postContext?: string                    // optional: the post text, for context
// }
// Returns: { b64_json: string, model: string, size: string, prompt: string }
router.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY no está configurado en el backend.' });
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    if (prompt.length > MAX_PROMPT_CHARS) {
      return res.status(400).json({ error: `prompt demasiado largo (${prompt.length} > ${MAX_PROMPT_CHARS})` });
    }

    const style = typeof body.style === 'string' ? body.style : undefined;
    const palette = typeof body.palette === 'string' ? body.palette : undefined;
    // Strip lone UTF-16 surrogates from postContext — LinkedIn-scraped text
    // can contain orphan emoji halves that break JSON encoding when forwarded
    // to OpenAI / Anthropic.
    const postContext =
      typeof body.postContext === 'string' ? stripLoneSurrogates(body.postContext) : undefined;
    // `allowText` modes:
    //   true  → user explicitly wants text in the image (tweet, quote, poster…)
    //   false → user explicitly forbids text
    //   undefined → auto-detect from prompt heuristics
    const allowText: boolean | undefined =
      typeof body.allowText === 'boolean' ? body.allowText : undefined;
    const sizeRaw = typeof body.size === 'string' ? body.size : '1024x1024';
    const size: SizeOption = (VALID_SIZES as string[]).includes(sizeRaw)
      ? (sizeRaw as SizeOption)
      : '1024x1024';

    const logoDataUrl = isDataUrl(body.logoDataUrl) ? body.logoDataUrl : undefined;
    const referenceDataUrl = isDataUrl(body.referenceDataUrl) ? body.referenceDataUrl : undefined;

    if (logoDataUrl && logoDataUrl.length > MAX_DATA_URL_BYTES) {
      return res.status(400).json({ error: 'logo demasiado grande (>12MB)' });
    }
    if (referenceDataUrl && referenceDataUrl.length > MAX_DATA_URL_BYTES) {
      return res.status(400).json({ error: 'referencia demasiado grande (>12MB)' });
    }

    const finalPrompt = buildPrompt({
      prompt,
      style,
      palette,
      hasLogo: !!logoDataUrl,
      hasReference: !!referenceDataUrl,
      postContext,
      allowText,
    });
    // Resolve once for the response, so the frontend can show the user
    // whether text-in-image was applied (auto or explicit).
    const resolvedAllowText =
      allowText !== undefined ? allowText : detectTextIntent(prompt);

    const client = new OpenAI({ apiKey });

    let b64: string | undefined;

    // Branch: if any reference image is provided we use images.edit (which
    // accepts source images); otherwise plain images.generate.
    if (logoDataUrl || referenceDataUrl) {
      const images: Awaited<ReturnType<typeof dataUrlToFile>>[] = [];
      if (referenceDataUrl) images.push(await dataUrlToFile(referenceDataUrl, 'reference.png'));
      if (logoDataUrl) images.push(await dataUrlToFile(logoDataUrl, 'logo.png'));

      const result = await client.images.edit({
        model: IMAGE_MODEL,
        // The OpenAI SDK accepts a single File or an array; types differ
        // across SDK versions, so we cast to keep the call portable.
        image: (images.length === 1 ? images[0] : (images as any)) as any,
        prompt: finalPrompt,
        size,
      } as any);
      b64 = result.data?.[0]?.b64_json;
    } else {
      const result = await client.images.generate({
        model: IMAGE_MODEL,
        prompt: finalPrompt,
        size,
      } as any);
      b64 = result.data?.[0]?.b64_json;
    }

    if (!b64) {
      return res.status(502).json({ error: 'OpenAI no devolvió imagen' });
    }

    res.json({
      b64_json: b64,
      model: IMAGE_MODEL,
      size,
      prompt: finalPrompt,
      // Surface the resolved text policy so the UI can show it (auto vs explicit).
      allowText: resolvedAllowText,
      textIntentAuto: allowText === undefined,
    });
  } catch (err: any) {
    // OpenAI errors carry a structured `.status` and `.error.message`. Surface
    // those when present so the frontend shows something actionable instead of
    // a generic 500.
    const status = err?.status || 500;
    const message = err?.error?.message || err?.message || 'Error generando imagen';
    console.error('[generate-image] Error:', message);
    res.status(status === 200 ? 500 : status).json({ error: message });
  }
});

export default router;
