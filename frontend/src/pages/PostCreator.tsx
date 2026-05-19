import { useState, useRef, useEffect } from 'react';
import LinkedInPostPreview from '../components/postcreator/LinkedInPostPreview';
import MarkdownMessage from '../components/postcreator/MarkdownMessage';
import ImageGenerator from '../components/postcreator/ImageGenerator';
import CarouselGenerator from '../components/postcreator/CarouselGenerator';

const BASE = import.meta.env.VITE_API_URL || '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Preview persona = one of our managed accounts (Iker / Unai). We post
// for both now, so the preview shows whichever identity you pick. Name +
// photo + headline come straight from the Accounts data (always fresh),
// not the old standalone creator_profile.
interface Persona {
  id: string;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
}

// Extract post blocks from an assistant message. Tries several strategies in
// order so it works whether the model emits `---` separators, numbered
// "OPCIÓN" / "OPTION" / "VARIANTE" headings, fenced code blocks, or none.
function extractPostBlocks(content: string): string[] {
  const cleaned = content.trim();
  if (cleaned.length < 50) return [];

  // 1. `---` delimited (legacy explicit separator)
  const dashed = cleaned.split(/\n---+\n/).map((b) => b.trim()).filter((b) => b.length > 50);
  if (dashed.length >= 2) return dashed;

  // 2. Numbered "OPCIÓN N" / "OPTION N" / "VARIANTE N" / "VERSIÓN N" headings.
  // This is what the chat actually emits most of the time, and is what the
  // user sees in the screenshot. Each match starts a new block; the block
  // runs until the next match or end of message.
  const optionRegex =
    /(?:^|\n)\s*(?:📌|✨|🎯|📝|⭐)?\s*(?:OPCIÓN|OPCION|OPTION|VARIANT|VARIANTE|VERSIÓN|VERSION|VARIACIÓN|VARIACION|VARIATION)\s*\d+\s*[:\-—]/gi;
  const matches = [...cleaned.matchAll(optionRegex)];
  if (matches.length >= 2) {
    const blocks: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index ?? 0;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? cleaned.length) : cleaned.length;
      blocks.push(cleaned.slice(start, end).trim());
    }
    return blocks.filter((b) => b.length > 50);
  }

  // 3. Fenced code blocks (the model sometimes wraps the post in ```)
  const fenceMatches = [...cleaned.matchAll(/```(?:[a-zA-Z0-9_-]*\n)?([\s\S]+?)```/g)];
  if (fenceMatches.length >= 1) {
    const blocks = fenceMatches.map((m) => m[1].trim()).filter((b) => b.length > 50);
    if (blocks.length >= 1) return blocks;
  }

  // 4. Fall back: treat the whole message as a single block. The user can
  // always click "send to preview" and trim by hand.
  return [cleaned];
}

// Within a single detected block, find the actual post text. The chat often
// wraps the post in commentary ("## **VARIACIÓN 2: archetype name…**\n\n*(meta…)*
// \n\n<post>\n\nPor qué funciona: …"). We strip leading heading lines and
// trailing meta lines so the preview gets the post body, not the wrapper text.
function cleanBlockForPreview(block: string): string {
  let text = block.trim();

  // Iterate up to 3 leading lines and strip any that look like metadata:
  //   - markdown headings ("## **VARIACIÓN 2:**")
  //   - plain "OPCIÓN N: …" lines
  //   - italic / parenthesised meta ("(Arquetipo con 5.8x ratio…)")
  //   - leftover empty lines
  for (let i = 0; i < 3; i++) {
    const before = text;

    // (a) optional markdown leader (#, **) + option/variation keyword
    text = text.replace(
      /^\s*(?:#{1,6}\s*)?(?:\*\*|\*)?\s*(?:📌|✨|🎯|📝|⭐)?\s*(?:OPCIÓN|OPCION|OPTION|VARIANT|VARIANTE|VERSIÓN|VERSION|VARIACIÓN|VARIACION|VARIATION)\s*\d+[^\n]*\n+/i,
      ''
    );

    // (b) italic-wrapped or parenthesised meta line (often "(Arquetipo…)")
    text = text.replace(/^\s*(?:\*+\s*)?\(?[^()\n]*?(?:rati[oó]|arquetipo|formato|estilo|hook)[^()\n]*\)?\*?\s*\n+/i, '');

    // (c) plain leading parens line
    text = text.replace(/^\s*\*?\([^)\n]*\)\*?\s*\n+/, '');

    if (text === before) break;
    text = text.trimStart();
  }

  // Strip a trailing "Por qué funciona:" / "Why this works:" commentary block
  // (everything from that label to the end of the block).
  text = text.replace(/\n+(?:Por qué funciona|Why this works|Why it works|Mi recomendación|Recomendación)[\s\S]*$/i, '');

  // Strip surrounding code-block fences if any survived.
  text = text.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```\s*$/, '');

  // Strip stray leading/trailing markdown bold/italic markers
  text = text.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '');

  return text.trim();
}

export default function PostCreator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  // null = user hasn't edited (use the latest generated text); string = user
  // has typed something, including '' if they cleared the field. This split
  // matters because `manualPreview || previewText` falls back to previewText
  // on empty, so without the sentinel the textarea snaps back to the
  // pre-edit text the moment the user selects-all and deletes.
  const [manualPreview, setManualPreview] = useState<string | null>(null);
  // The right column shows the FINAL artifact (post text + image) plus the
  // image/carousel generators all together in one scroll, no tabs.
  // Image generated by the AI generator panel. When set, it's embedded into
  // the LinkedIn preview where the post image would naturally appear.
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load managed accounts (Iker / Unai …) for the preview persona picker.
  useEffect(() => {
    fetch(`${BASE}/api/accounts`)
      .then((r) => r.json())
      .then((data) => {
        const list: Persona[] = Array.isArray(data)
          ? data.map((a: any) => ({
              id: a.id,
              name: a.name,
              headline: a.headline,
              profile_image_url: a.profile_image_url,
              followers_count: a.followers_count ?? 0,
            }))
          : [];
        setPersonas(list);
        if (list.length > 0) setPersonaId((prev) => prev ?? list[0].id);
      })
      .catch(() => {});
  }, []);

  const activePersona = personas.find((p) => p.id === personaId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Auto-update preview with the latest post block from the last assistant message
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        const blocks = extractPostBlocks(messages[i].content);
        if (blocks.length > 0) {
          // Pick longest block (typically the full post) and strip wrapper text
          const longest = blocks.reduce((a, b) => (a.length > b.length ? a : b));
          setPreviewText(cleanBlockForPreview(longest));
          return;
        }
      }
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || streaming) return;

    setInput('');
    setError(null);

    const userMsg: Message = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      const res = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const activePreviewText = manualPreview != null ? manualPreview : previewText;

  return (
    // Offset = global nav (~64px) + the <main> py-8 top+bottom (64px) so
    // the input bar lands inside the viewport at entry (no scroll). The
    // old -80px under-counted the chrome and pushed Send below the fold.
    <div className="flex flex-col h-[calc(100vh-128px)]">
      {/* Compact header — just the title. The "My Profile" tab was removed:
          we post for both Iker & Unai and that standalone profile was
          stale; voice/style now comes from the live managed-account data
          and the preview identity is chosen per-post below. */}
      <div className="flex items-center border-b border-border mb-3 pr-1">
        <h1 className="text-lg font-semibold text-text-primary leading-none py-2">Post Creator</h1>
      </div>

      {(
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Chat column */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-5xl mb-4">&#x270D;&#xFE0F;</div>
                  <h2 className="text-xl font-semibold text-text-primary mb-1">Create viral LinkedIn posts</h2>
                  <p className="text-text-muted text-sm mb-5">Based on your outlier data.</p>
                  <div className="max-w-md text-left text-xs text-text-muted space-y-2">
                    <p>🖼️ Also suggests post image ideas, based on what actually works.</p>
                    <p>🎬 For video scripts, just say <span className="text-accent">"video"</span> in your request.</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-accent/20 text-text-primary'
                        : 'bg-bg-card border border-border text-text-primary'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div>
                        <MarkdownMessage content={msg.content} />

                        {msg.content && !streaming && (() => {
                          const blocks = extractPostBlocks(msg.content);
                          const showPerBlockButtons = blocks.length > 1;
                          return (
                            <div className="flex gap-1.5 mt-3 pt-2 border-t border-border/50 flex-wrap items-center">
                              {showPerBlockButtons ? (
                                blocks.map((block, bi) => (
                                  <button
                                    key={bi}
                                    onClick={() => {
                                      const clean = cleanBlockForPreview(block);
                                      setManualPreview(clean);
                                      setPreviewTab('preview');
                                    }}
                                    className="text-[11px] px-2.5 py-1 rounded-md border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                                  >
                                    📤 Preview opción {bi + 1}
                                  </button>
                                ))
                              ) : (
                                <button
                                  onClick={() => {
                                    const block = blocks[0] || msg.content;
                                    const clean = cleanBlockForPreview(block);
                                    setManualPreview(clean);
                                    setPreviewTab('preview');
                                  }}
                                  className="text-[11px] px-2.5 py-1 rounded-md border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                                >
                                  📤 Send to preview
                                </button>
                              )}
                              <span className="ml-auto flex gap-2">
                                <button
                                  onClick={() => copyToClipboard(msg.content)}
                                  className="text-[10px] text-text-muted hover:text-accent transition-colors"
                                >
                                  Copy all
                                </button>
                              </span>
                            </div>
                          );
                        })()}

                        {streaming && i === messages.length - 1 && (
                          <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5" />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-3 text-danger text-sm">
                {error}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe the post you want to create... (topic, audience, goal)"
                  rows={1}
                  className="flex-1 bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-none"
                  disabled={streaming}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || streaming}
                  className="px-5 py-3 bg-accent text-bg-primary rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-accent-light transition-colors whitespace-nowrap"
                >
                  {streaming ? 'Writing...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview column — the post preview, the inline editor, and the
              image/carousel generators stacked in one scroll. */}
          <div className="w-[460px] flex-shrink-0 flex flex-col min-h-0">
            {/* Header: title + actions. Stays at the top of the column as a
                flex sibling above the scrolling content pane. */}
            <div className="flex-shrink-0 pb-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-primary">LinkedIn Preview</h3>
                {activePreviewText && (
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <button
                      onClick={() => copyToClipboard(activePreviewText)}
                      className="hover:text-accent transition-colors"
                      title="Copiar texto"
                    >
                      📋 Copiar
                    </button>
                    <span className="text-border">·</span>
                    <button
                      onClick={() => {
                        setManualPreview(null);
                        setPreviewText('');
                        setGeneratedImageUrl(null);
                      }}
                      className="hover:text-danger transition-colors"
                      title="Limpiar preview"
                    >
                      ✕ Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Persona picker — preview the post as Iker or Unai
                  (name + photo pulled live from Accounts). */}
              {personas.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-text-muted mr-0.5">Ver como:</span>
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPersonaId(p.id)}
                      className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border transition-colors ${
                        p.id === personaId
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-bg-card text-text-muted hover:border-accent/30'
                      }`}
                    >
                      {p.profile_image_url ? (
                        <img src={p.profile_image_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-bg-secondary inline-flex items-center justify-center text-[8px]">
                          {(p.name || '?')[0]}
                        </span>
                      )}
                      {(p.name || 'Cuenta').split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stacked content — preview + editor + image/carousel
                generators in a single scroll so the user reviews the
                FINAL artifact (text + image) together. */}
            <div className="flex-1 overflow-y-auto pb-4 space-y-4">
              {!activePreviewText ? (
                <div className="bg-bg-card border border-dashed border-border rounded-xl p-8 text-center text-text-muted text-xs">
                  Your post preview will appear here once the AI generates content.
                  <br />
                  <br />
                  You can also paste any text below to preview it.
                  <textarea
                    value={manualPreview ?? ''}
                    onChange={(e) => setManualPreview(e.target.value)}
                    rows={5}
                    className="w-full mt-3 bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-accent/50 resize-none text-left"
                    placeholder="Paste post text..."
                  />
                </div>
              ) : (
                <>
                  {/* 1. The post itself, with the AI image embedded inside */}
                  <div>
                    <LinkedInPostPreview
                      text={activePreviewText}
                      authorName={activePersona?.name}
                      authorHeadline={activePersona?.headline}
                      authorImage={activePersona?.profile_image_url}
                      followersCount={activePersona?.followers_count}
                      externalImageUrl={generatedImageUrl}
                    />
                    {/* Always-visible edit textarea — typing here updates the
                        preview above in real time. The previous "✏️ Editar"
                        toggle hid this and broke the core editing flow. */}
                    <div className="mt-3 max-w-lg mx-auto">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] text-text-muted font-medium">
                          ✏️ Editar texto del post
                        </label>
                        <span className="text-[10px] text-text-muted">
                          {activePreviewText.length} chars
                        </span>
                      </div>
                      <textarea
                        value={activePreviewText}
                        onChange={(e) => setManualPreview(e.target.value)}
                        rows={8}
                        className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-accent/50 resize-y leading-relaxed"
                        placeholder="Edit the post to see the preview update..."
                      />
                      <p className="text-[10px] text-text-muted mt-1">
                        Los cambios se reflejan en vivo en el preview de arriba.
                      </p>
                    </div>
                  </div>

                  {/* 2. Image generator panel — produces the image embedded above */}
                  <div className="max-w-lg mx-auto">
                    <ImageGenerator
                      postContext={activePreviewText}
                      defaultOpen
                      onResult={(r) =>
                        setGeneratedImageUrl(`data:image/png;base64,${r.b64_json}`)
                      }
                    />
                  </div>

                  {/* 3. Carousel generator — collapsed by default. Writes
                      slide content with Claude, renders Neety-branded HTML
                      templates, exports to PDF for LinkedIn document posts. */}
                  <div className="max-w-lg mx-auto">
                    <CarouselGenerator postContext={activePreviewText} />
                  </div>

                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
