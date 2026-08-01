import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// The complete className each real element renders with, as one joined
// string per element — not split into fragments. MARKDOWN_COMPONENTS below
// applies these directly, with nothing hardcoded of its own, so there's
// only one place that defines what any of this looks like. Exported so
// other renderers of the same markdown "look" (the ruleset editor's
// CodeMirror live view, which applies styling via decorations rather than
// JSX and so can't reuse these components directly) build from the exact
// same source instead of a hand-retyped approximation.
export const MARKDOWN_STYLES = {
  p: "mb-4 last:mb-0 text-sm font-light leading-relaxed",
  strong: "text-sm font-semibold text-gold-300",
  em: "italic text-gold-600",
  h1: "text-gold-500 text-2xl font-bold leading-tight mb-2",
  h2: "text-gold-400 text-lg leading-tight font-semibold mb-1 mt-6",
  h3: "text-gold-400 font-bold mt-6",
  hr: "border-0 h-px bg-gold-500/20 mb-3 mt-2",
  code: "rounded bg-gold-500/10 text-xs font-light px-1 py-0.5 font-mono text-gold-400",
  blockquote: "border-l-2 border-gold-500/40 pl-3 italic text-gold-500 text-sm mb-4 last:mb-0",
};

const MARKDOWN_COMPONENTS = {
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={MARKDOWN_STYLES.p}>{children}</p>
  ),
  strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <strong className={MARKDOWN_STYLES.strong}>{children}</strong>
  ),
  em: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <em className={MARKDOWN_STYLES.em}>{children}</em>
  ),
  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-4 flex flex-col last:pb-0 pb-2 text-sm">{children}</ul>
  ),
  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-4 flex flex-col mb-2 last:mb-0">{children}</ol>
  ),
  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-snuglast:mb-0 text-sm text-gold-500/80">{children}</li>
  ),
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={MARKDOWN_STYLES.h1}>{children}</h1>
  ),
  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={MARKDOWN_STYLES.h2}>{children}</h2>
  ),
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={MARKDOWN_STYLES.h3}>{children}</h3>
  ),
  hr: () => (
    <hr className={MARKDOWN_STYLES.hr} />
  ),
  code: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <code className={MARKDOWN_STYLES.code}>{children}</code>
  ),
  blockquote: ({ children }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className={MARKDOWN_STYLES.blockquote}>{children}</blockquote>
  ),
  table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="mb-4 last:mb-0 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="border-b border-gold-500/30">{children}</thead>
  ),
  tr: ({ children }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-gold-500/10 last:border-0">{children}</tr>
  ),
  th: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="text-left px-2 py-1.5 text-gold-400 font-semibold">{children}</th>
  ),
  td: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-2 py-1.5 text-gold-300 align-top">{children}</td>
  ),
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`text-gold-400 leading-snug ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]} components={MARKDOWN_COMPONENTS as never}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
