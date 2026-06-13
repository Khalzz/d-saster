import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`text-gold-600 leading-snug [&>p]:leading-snug [&>p]:mb-2 [&>p:last-child]:mb-0 [&_hr]:border-0 [&_hr]:h-px [&_hr]:bg-gold-500/20 [&_hr]:mb-3 [&_hr]:mt-2 [&_li]:leading-snug [&_li:last-child]:mb-0 [&_li>p]:mt-0 [&_li_p]:mb-1 [&_li>p:last-child]:mb-0 [&_strong]:text-gold-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:mb-2 [&_h1]:text-gold-300 [&_h1]:text-lg [&_h1]:mb-1 [&_h1]:font-bold [&_h2]:text-gold-400 [&_h2]:text-lg [&_h2]:pt-2 [&_h2]:font-semibold [&_h2]:flex [&_h2]:items-center [&_h2]:gap-3 [&_h2]:after:content-[''] [&_h2]:after:flex-1 [&_h2]:after:h-px [&_h2]:after:bg-gold-500/20 [&_h3]:text-gold-300 [&_h3]:text-sm [&_h3]:font-bold ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{children}</ReactMarkdown>
    </div>
  );
}
