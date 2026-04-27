import { useState, useRef, useEffect } from 'react';
import LinkedInPostPreview from '../components/postcreator/LinkedInPostPreview';
import CreatorProfileForm from '../components/postcreator/CreatorProfileForm';
import PostChecklist from '../components/postcreator/PostChecklist';
import MarkdownMessage from '../components/postcreator/MarkdownMessage';

const BASE = import.meta.env.VITE_API_URL || '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CreatorProfile {
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
}

const SUGGESTIONS = [
  'Write me a viral LinkedIn post about hiring mistakes',
  'Create a post about leadership lessons using the best-performing archetype',
  'Write 3 variations of a post about AI replacing jobs',
  'Analyze this topic and give me the best angle: remote work vs office',
];

type Tab = 'chat' | 'profile';

// Extract all post blocks (text between --- markers) from an assistant message
function extractPostBlocks(content: string): string[] {
  const blocks = content.split(/\n---+\n/).map((b) => b.trim()).filter((b) => b.length > 50);
  return blocks;
}

export default function PostCreator() {
  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [manualPreview, setManualPreview] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load profile on mount
  useEffect(() => {
    fetch(`${BASE}/api/post-creator/profile`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) setProfile(data);
      })
      .catch(() => {});
  }, []);

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
          // Pick longest block (typically the full post)
          const longest = blocks.reduce((a, b) => (a.length > b.length ? a : b));
          setPreviewText(longest);
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

  const activePreviewText = manualPreview || previewText;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Compact header — title + tabs share a single 48px row.
          The long descriptive subtitle from the original layout was
          eating ~110px of vertical space and only restated what the
          page already implies, so it's been removed. The inline
          subtitle keeps a hint of context for first-time visitors. */}
      <div className="flex items-center gap-6 border-b border-border mb-3 pr-1">
        <div className="flex items-baseline gap-3 py-2 flex-shrink-0">
          <h1 className="text-lg font-semibold text-text-primary leading-none">Post Creator</h1>
          <span className="hidden md:inline text-[11px] text-text-muted leading-none">
            AI writer trained on your outlier data
          </span>
        </div>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setTab('chat')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'chat'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setTab('profile')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'profile'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            My Profile {profile?.name ? `· ${profile.name}` : ''}
          </button>
        </div>
      </div>

      {tab === 'profile' ? (
        <div className="overflow-y-auto">
          <CreatorProfileForm onSaved={(p) => setProfile(p)} />
        </div>
      ) : (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Chat column */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-5xl mb-4">&#x270D;&#xFE0F;</div>
                  <h2 className="text-xl font-semibold text-text-primary mb-2">Create viral LinkedIn posts</h2>
                  <p className="text-text-muted text-sm max-w-md mb-4">
                    Tell me a topic, audience, or goal and I'll write posts using the patterns
                    that actually produce outliers in your data.
                  </p>
                  {!profile?.name && (
                    <button
                      onClick={() => setTab('profile')}
                      className="text-xs text-accent hover:text-accent-light mb-6"
                    >
                      → Link your LinkedIn profile for personalized posts
                    </button>
                  )}
                  <div className="flex flex-wrap gap-2 max-w-2xl justify-center">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s)}
                        className="px-3 py-2 bg-bg-card border border-border rounded-lg text-xs text-text-secondary hover:border-accent/50 hover:text-text-primary transition-colors text-left"
                      >
                        {s}
                      </button>
                    ))}
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

                        {msg.content && !streaming && (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-border/50 flex-wrap">
                            <button
                              onClick={() => copyToClipboard(msg.content)}
                              className="text-[10px] text-text-muted hover:text-accent transition-colors"
                            >
                              Copy all
                            </button>
                            {extractPostBlocks(msg.content).map((block, bi) => (
                              <button
                                key={bi}
                                onClick={() => {
                                  setManualPreview(block);
                                  copyToClipboard(block);
                                }}
                                className="text-[10px] text-accent hover:text-accent-light transition-colors"
                              >
                                Preview post {extractPostBlocks(msg.content).length > 1 ? bi + 1 : ''}
                              </button>
                            ))}
                          </div>
                        )}

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

          {/* Preview column */}
          <div className="w-[460px] flex-shrink-0 overflow-y-auto pb-4">
            <div className="sticky top-0 mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">LinkedIn Preview</h3>
              {activePreviewText && (
                <button
                  onClick={() => {
                    setManualPreview('');
                    setPreviewText('');
                  }}
                  className="text-[10px] text-text-muted hover:text-accent"
                >
                  Clear
                </button>
              )}
            </div>
            {activePreviewText ? (
              <>
                <LinkedInPostPreview
                  text={activePreviewText}
                  authorName={profile?.name}
                  authorHeadline={profile?.headline}
                  authorImage={profile?.profile_image_url}
                  followersCount={profile?.followers_count}
                />
                <div className="mt-3 max-w-lg mx-auto">
                  <textarea
                    value={activePreviewText}
                    onChange={(e) => setManualPreview(e.target.value)}
                    rows={6}
                    className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-accent/50 resize-none"
                    placeholder="Edit the post to see the preview update..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => copyToClipboard(activePreviewText)}
                      className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded text-xs font-medium hover:bg-accent/20 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="mt-4 max-w-lg mx-auto">
                  <PostChecklist text={activePreviewText} onImproved={setManualPreview} />
                </div>
              </>
            ) : (
              <div className="bg-bg-card border border-dashed border-border rounded-xl p-8 text-center text-text-muted text-xs">
                Your post preview will appear here once the AI generates content.
                <br />
                <br />
                You can also paste any text below to preview it.
                <textarea
                  value={manualPreview}
                  onChange={(e) => setManualPreview(e.target.value)}
                  rows={5}
                  className="w-full mt-3 bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-accent/50 resize-none text-left"
                  placeholder="Paste post text..."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
