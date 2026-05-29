import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({ children, text, className }: { children: React.ReactNode; text: string; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
    setVisible(true);
  };

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full pointer-events-none bg-surface border border-gold-500/30 rounded-lg px-3 py-2 shadow-xl w-max max-w-64"
          style={{ top: pos.top, left: pos.left }}
        >
          <p className="text-[10px] text-gold-600 leading-snug">{text}</p>
        </div>,
        document.body
      )}
    </div>
  );
}