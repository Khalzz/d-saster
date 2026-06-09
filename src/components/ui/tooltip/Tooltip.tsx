import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Markdown } from "../Markdown";

export default function Tooltip({ children, text, title, badge, className }: { children: React.ReactNode; text: string; title?: string; badge?: string; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [nudge, setNudge] = useState(0);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      setPos({ top: rect.top - 8, left: centerX });
      setNudge(0);

      // Defer edge detection to after portal renders
      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const tipRect = tooltipRef.current.getBoundingClientRect();
          let offset = 0;
          if (tipRect.left < 8) {
            offset = 8 - tipRect.left;
          } else if (tipRect.right > window.innerWidth - 8) {
            offset = window.innerWidth - 8 - tipRect.right;
          }
          if (offset !== 0) setNudge(offset);
        }
      });
    }
    setVisible(true);
  };

  return (
    <div
      ref={ref}
      className={`relative ${className ?? ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-50 -translate-x-1/2 -translate-y-full pointer-events-none bg-surface border border-gold-500/30 rounded-lg px-3 py-2 shadow-xl w-max max-w-64"
          style={{ top: pos.top, left: pos.left + nudge }}
        >
          {title && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-gold-300 text-xs font-medium">{title}</p>
              {badge && <span className="text-gold-600 text-[9px] font-semibold uppercase tracking-wider">{badge}</span>}
            </div>
          )}
          <Markdown className="text-[10px]">{text}</Markdown>
        </div>,
        document.body
      )}
    </div>
  );
}