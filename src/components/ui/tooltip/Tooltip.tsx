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
          className="fixed z-50 -translate-x-1/2 -translate-y-full bg-surface border border-gold-500 text-gold-500 text-sm rounded-md px-2 py-1 pointer-events-none whitespace-nowrap"
          style={{ top: pos.top, left: pos.left }}
        >
          {text}
        </div>,
        document.body
      )}
    </div>
  );
}