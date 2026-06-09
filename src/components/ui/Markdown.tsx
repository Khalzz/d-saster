import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`text-gold-600 leading-snug [&>p]:leading-snug [&>p]:mb-2 [&>p:last-child]:mb-0 [&_li]:leading-snug [&_li_p]:my-0 [&_strong]:text-gold-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-3 [&_h1]:text-gold-300 [&_h1]:font-bold [&_h2]:text-gold-400 [&_h2]:font-semibold ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{children}</ReactMarkdown>
    </div>
  );
}
