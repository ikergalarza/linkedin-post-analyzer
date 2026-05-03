import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { stripLoneSurrogates } from '../utils/sanitizeText';

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Slide kinds map to which template a slide uses on the frontend:
//   cover → big hook + subtitle
//   body  → numbered point with title + body
//   cta   → final ask + follow / save / share line
type SlideKind = 'cover' | 'body' | 'cta';

interface Slide {
  kind: SlideKind;
  title: string;
  body: string;
  subtitle?: string; // only used by cover
}

const sanitize = (t: unknown): string =>
  typeof t === 'string'
    ? stripLoneSurrogates(t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim())
    : '';

// Robust JSON extraction. The model sometimes wraps the array in prose or
// markdown fences; we extract the outermost {…} and try to parse.
function parseCarouselJson(raw: string): Slide[] | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!parsed?.slides || !Array.isArray(parsed.slides)) return null;
    const slides: Slide[] = parsed.slides
      .map((s: any): Slide | null => {
        const kind = (s?.kind || 'body') as SlideKind;
        if (!['cover', 'body', 'cta'].includes(kind)) return null;
        const title = sanitize(s?.title).slice(0, 120);
        const body = sanitize(s?.body).slice(0, 600);
        if (!title) return null;
        return {
          kind,
          title,
          body,
          subtitle: s?.subtitle ? sanitize(s.subtitle).slice(0, 160) : undefined,
        };
      })
      .filter((s: Slide | null): s is Slide => s !== null);
    return slides.length > 0 ? slides : null;
  } catch {
    return null;
  }
}

// POST /api/post-creator/generate-carousel
// Body:
//   topic: string                    required — what the carousel is about
//   slides?: number                   default 7 (3-12 range)
//   audience?: string
//   tone?: string                     "directo" | "didáctico" | "narrativo" | free text
//   postContext?: string              base the carousel on an existing post
router.post('/generate-carousel', async (req: Request, res: Response) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurado' });
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const topic = sanitize(body.topic);
    const audience = sanitize(body.audience);
    const tone = sanitize(body.tone);
    const postContext = sanitize(body.postContext);
    const requestedSlides = Math.max(3, Math.min(12, Number(body.slides) || 7));

    if (!topic && !postContext) {
      return res.status(400).json({ error: 'topic o postContext es requerido' });
    }

    // The carousel structure is fixed: 1 cover + N-2 body + 1 cta. The model
    // gets a strict template so the JSON shape is predictable.
    const bodyCount = requestedSlides - 2;

    const system = `Eres un experto en LinkedIn carousels (carruseles). Escribes carouseles que la gente realmente swipea hasta el final.

═══ ESTRUCTURA OBLIGATORIA ═══
Un carrusel de ${requestedSlides} slides:
- Slide 1 (kind:"cover"): hook potente. Máx 9 palabras en title, 12 en subtitle. El subtitle teasea sin spoiler.
- Slides 2 a ${requestedSlides - 1} (kind:"body"): cada uno desarrolla UN solo punto. Title 5-8 palabras, body 30-60 palabras MÁX (es móvil, escasea espacio).
- Slide ${requestedSlides} (kind:"cta"): cierre + petición concreta (comentar / compartir / guardar / seguir). Title con la conclusión, body con la llamada a acción.

═══ CALIDAD ═══
- Cada slide vive solo. Si alguien ve solo el slide 4 sin contexto, debe entenderse.
- Usa números, ejemplos, comparaciones — NUNCA generalidades vagas.
- Sin jerga corporativa. Sin "leverage", "synergy", "in today's world".
- Primera persona si tiene sentido ("hice", "vi", "perdí").
- Sin emojis salvo en el cover. Sin hashtags.
- Sin markdown — texto plano, ni **bold** ni headers.
- Mismo idioma que el topic / postContext.

═══ FORMATO DE RESPUESTA ═══
Devuelve SOLO un JSON object con esta forma exacta — sin prosa antes ni después, sin markdown fences:

{"slides":[{"kind":"cover","title":"...","subtitle":"..."},{"kind":"body","title":"...","body":"..."},{"kind":"body","title":"...","body":"..."},{"kind":"cta","title":"...","body":"..."}]}

Total slides: ${requestedSlides} (1 cover + ${bodyCount} body + 1 cta).`;

    const userParts: string[] = [];
    if (topic) userParts.push(`TEMA: ${topic}`);
    if (audience) userParts.push(`AUDIENCIA: ${audience}`);
    if (tone) userParts.push(`TONO: ${tone}`);
    if (postContext) {
      userParts.push(`POST DE BASE (transforma este post largo en un carrusel de ${requestedSlides} slides):\n"""\n${postContext.slice(0, 4000)}\n"""`);
    }
    userParts.push(`Genera el carrusel ahora. Recuerda: ${requestedSlides} slides total (1 cover + ${bodyCount} body + 1 cta). JSON only.`);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: userParts.join('\n\n') }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const slides = parseCarouselJson(raw);
    if (!slides || slides.length === 0) {
      return res.status(502).json({ error: 'El modelo no devolvió un carrusel válido. Reintenta.' });
    }

    res.json({
      slides,
      requested: requestedSlides,
      generated: slides.length,
    });
  } catch (err: any) {
    console.error('[generate-carousel] Error:', err.message);
    res.status(500).json({ error: err.message || 'Error generando el carrusel' });
  }
});

export default router;
