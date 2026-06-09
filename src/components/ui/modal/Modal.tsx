import { useRef, useState, useEffect } from "react";

export default function Modal({ children, className, isOpen, onClose }: { children: React.ReactNode, className?: string, isOpen?: boolean, onClose?: () => void }) {
  const mouseDownTarget = useRef<EventTarget | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-30 backdrop-blur-lg flex items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"} ${className}`}
      onMouseDown={(e) => { mouseDownTarget.current = e.target; }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="w-full p-4 flex justify-center">
        {children}
      </div>
    </div>
  );
}