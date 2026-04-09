import { useState, useRef, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Write me a viral LinkedIn post about hiring mistakes',
  'Create a post about leadership lessons using the best-performing archetype',
  'What hook types and structures work best? Then write a post about personal branding',
  'Write 3 variations of a post about AI replacing jobs',
  'Analyze this topic and give me the best angle: remote work vs office',
];

export default function PostCreator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

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
      // Remove the empty assistant message on error
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

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-1">Post Creator</h1>
        <p className="text-text-secondary text-sm">
          AI-powered post writer trained on your outlier data. It knows which hooks, structures, and tones
          produce the highest outlier ratios across all your analyzed creators.
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">&#x270D;&#xFE0F;</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Create viral LinkedIn posts</h2>
            <p className="text-text-muted text-sm max-w-md mb-8">
              Tell me a topic, audience, or goal and I'll write posts using the patterns
              that actually produce outliers in your data.
            </p>
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
              className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-accent/20 text-text-primary'
                  : 'bg-bg-card border border-border text-text-primary'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="space-y-2">
                  {/* Render markdown-like content */}
                  {msg.content.split('\n').map((line, j) => {
                    // Detect post blocks (lines between --- or similar markers)
                    if (line.startsWith('# ')) {
                      return <h3 key={j} className="text-base font-bold text-accent mt-2">{line.slice(2)}</h3>;
                    }
                    if (line.startsWith('## ')) {
                      return <h4 key={j} className="text-sm font-bold text-text-primary mt-2">{line.slice(3)}</h4>;
                    }
                    if (line.startsWith('### ')) {
                      return <h4 key={j} className="text-sm font-semibold text-text-secondary mt-1">{line.slice(4)}</h4>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={j} className="text-sm font-bold text-text-primary">{line.slice(2, -2)}</p>;
                    }
                    if (line.startsWith('---')) {
                      return <hr key={j} className="border-border my-2" />;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return <p key={j} className="text-sm text-text-secondary pl-3 before:content-['•'] before:mr-2 before:text-accent">{line.slice(2)}</p>;
                    }
                    if (line.trim() === '') {
                      return <div key={j} className="h-2" />;
                    }
                    // Bold inline
                    const parts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={j} className="text-sm text-text-secondary leading-relaxed">
                        {parts.map((part, k) =>
                          part.startsWith('**') && part.endsWith('**')
                            ? <strong key={k} className="text-text-primary font-semibold">{part.slice(2, -2)}</strong>
                            : part
                        )}
                      </p>
                    );
                  })}

                  {/* Copy button for assistant messages */}
                  {msg.content && !streaming && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-border/50">
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="text-[10px] text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                      >
                        <span>&#x1F4CB;</span> Copy all
                      </button>
                      {/* Try to find post blocks and offer individual copy */}
                      {msg.content.includes('---') && (
                        <button
                          onClick={() => {
                            // Extract the longest block between --- markers as the "post"
                            const blocks = msg.content.split(/---+/).filter((b) => b.trim().length > 50);
                            if (blocks.length > 0) {
                              const longest = blocks.reduce((a, b) => a.length > b.length ? a : b);
                              copyToClipboard(longest.trim());
                            }
                          }}
                          className="text-[10px] text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                        >
                          <span>&#x1F4DD;</span> Copy post
                        </button>
                      )}
                    </div>
                  )}

                  {/* Streaming indicator */}
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

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-3 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Input area */}
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
        <p className="text-[10px] text-text-muted mt-2 text-center">
          Powered by Claude + your outlier data. Write in any language.
        </p>
      </div>
    </div>
  );
}
