import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

const MARKDOWN_COMPONENTS = {
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className=" mb-2 last:mb-0 text-xs font-light leading-snug">{children}</p>
  ),
  strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="text-xs font-semibold text-gold-500">{children}</strong>
  ),
  em: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-4 flex flex-col last:pb-0 pb-2 text-xs">{children}</ul>
  ),
  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-4 flex flex-col gap-2 mb-2 last:mb-0">{children}</ol>
  ),
  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-snuglast:mb-0 text-gold-500/80">{children}</li>
  ),
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-gold-500 text-lg font-bold mb-1 leading-tight">{children}</h1>
  ),
  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-gold-400 text-medium leading-tight font-semibold mb-1 flex items-center gap-1.5 after:content-[''] after:flex-1 after:h-px after:bg-gold-500/20">{children}</h2>
  ),
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-gold-400 text-sm font-bold">{children}</h3>
  ),
  hr: () => (
    <hr className="border-0 h-px bg-gold-500/20 mb-3 mt-2" />
  ),
  code: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-gold-500/10 text-[10px] font-light px-1 py-0.5 font-mono text-gold-400">{children}</code>
  ),
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`text-gold-400 leading-snug ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]} components={MARKDOWN_COMPONENTS as never}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
