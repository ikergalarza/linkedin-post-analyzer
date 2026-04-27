import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders assistant chat content as proper markdown — full GFM support
 * (blockquotes, nested lists, bold inside list items, code, tables, etc.).
 *
 * The component map below keeps every node anchored to the design tokens
 * (`text-text-*`, `border-border`, `bg-bg-*`, `text-accent`) so the chat
 * still feels like part of the app instead of a generic markdown widget.
 */
export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-text-secondary [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="text-base font-bold text-accent mt-4 mb-2">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-sm font-bold text-text-primary mt-3 mb-1.5">{children}</h4>
          ),
          h3: ({ children }) => (
            <h4 className="text-sm font-semibold text-text-primary mt-3 mb-1">{children}</h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mt-2 mb-1">
              {children}
            </h5>
          ),
          p: ({ children }) => (
            <p className="text-sm text-text-secondary leading-relaxed my-2">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-text-primary">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
          // Lists: ul gets a custom accent bullet via a CSS-only marker, ol
          // uses the native decimal marker (also accented). The `&_li` selector
          // styles the items based on their parent rather than via a per-item
          // component override, which sidesteps react-markdown v10's removal
          // of the `ordered` prop on <li>.
          ul: ({ children }) => (
            <ul className="my-2 pl-5 space-y-1 list-disc marker:text-accent">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 pl-5 space-y-1 list-decimal marker:text-accent marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-text-secondary leading-relaxed pl-1">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent/40 bg-accent/5 pl-3 pr-2 py-1.5 my-2 italic text-text-primary rounded-r">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border my-3" />,
          // In react-markdown v10 the `inline` prop was removed. We treat
          // every <code> as inline by default; multi-line/fenced blocks are
          // wrapped in <pre> by the parser, and our <pre> override applies
          // the block styling there. This keeps the logic dead simple.
          code: ({ children }) => (
            <code className="bg-bg-primary border border-border rounded px-1 py-0.5 text-[12px] font-mono text-accent">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-bg-primary border border-border rounded-md px-3 py-2 my-2 text-[12px] font-mono text-text-primary overflow-x-auto whitespace-pre [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0 [&_code]:text-text-primary">
              {children}
            </pre>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-light underline underline-offset-2"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="w-full text-xs border border-border rounded">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-bg-primary px-2 py-1 text-left text-text-primary font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2 py-1 text-text-secondary">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
