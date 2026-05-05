import { useRef } from "react";

export default function Modal({ children, className, isOpen, onClose }: { children: React.ReactNode, className?: string, isOpen?: boolean, onClose?: () => void }) {
  const mouseDownTarget = useRef<EventTarget | null>(null);

  return (
    <div
      className={`fixed inset-0 z-30 backdrop-blur-lg flex items-center justify-center transition-opacity duration-300 ${isOpen === false ? "opacity-0 pointer-events-none" : "opacity-100"} ${className}`}
      onMouseDown={(e) => { mouseDownTarget.current = e.target; }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div>
        {children}
      </div>
    </div>
  );
}