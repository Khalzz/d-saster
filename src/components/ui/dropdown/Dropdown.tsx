import { useEffect, useRef, useState } from "react";

function Dropdown(
  { children }: { children: React.ReactNode },
) {
  const ref = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [align, setAlign] = useState<"left" | "right">("left");

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.top;
      const spaceRight = window.innerWidth - rect.left;

      if (spaceBelow < rect.height + 8) {
        setDirection("up");
      } else {
        setDirection("down");
      }

      if (spaceRight < rect.width + 8) {
        setAlign("right");
      } else {
        setAlign("left");
      }
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`absolute w-48 bg-surface border border-gold-500 rounded-md text-gold-500 overflow-hidden pointer-events-auto ${
        direction === "down" ? "mt-2" : "bottom-full mb-2"
      } ${align === "left" ? "left-0" : "right-0"}`}
    >
      {children}
    </div>
  );
}

function Option({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <div className={`px-4 py-2 hover:bg-gold-500/10 cursor-pointer transition-colors ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}

export { Dropdown, Option };