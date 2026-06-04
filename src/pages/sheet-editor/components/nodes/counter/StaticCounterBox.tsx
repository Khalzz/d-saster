import React from "react";

interface StaticCounterBoxProps {
  label: string;
  children: React.ReactNode;
  direction?: "vertical" | "horizontal";
  shieldView?: boolean;
  width?: number;    // percentage, 0 = auto
  height?: number;   // px, 0 = auto
  padding?: number;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function StaticCounterBox({
  label, children, direction = "vertical", shieldView = false, width = 0, height = 0, padding = 0, isSelected = false, onClick,
}: StaticCounterBoxProps) {
  const selectedClass = isSelected ? "outline outline-1 outline-offset-4 outline-gold-400" : "";
  const clickClass = onClick ? "cursor-pointer" : "";

  if (direction === "horizontal") {
    return (
      <div
        className={`${clickClass} rounded-lg ${selectedClass}`}
        style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}
        onClick={onClick}
      >
        <div className="flex items-center gap-2 rounded-lg border border-gold-500/20 px-3 py-2">
          <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider shrink-0">
            {label || "Counter"}
          </span>
          <div className="ml-auto">{children}</div>
        </div>
      </div>
    );
  }

  const boxStyle: React.CSSProperties = {
    borderRadius: shieldView ? "6px 6px 9999px 9999px" : "6px",
    height: height ? height : shieldView ? 70 : undefined,
  };

  return (
    <div
      className={`rounded-xs transition-colors ${clickClass} ${width ? "" : "w-fit"} ${selectedClass}`}
      style={{ padding, ...(width ? { width: `${width}%` } : {}) }}
      onClick={onClick}
    >
      <div
        className="flex flex-col justify-center items-center border border-gold-500/20 gap-0.5 px-2 overflow-hidden w-full"
        style={boxStyle}
      >
        <span className="text-gold-500 text-[10px] h-4 font-bold uppercase tracking-wider truncate w-full text-center">
          {label || "Counter"}
        </span>
        {children}
      </div>
    </div>
  );
}

// Renders a formula string with {{var}} tokens as highlighted chips
export function FormulaDisplay({ value, size = "lg" }: { value: string; size?: "sm" | "lg" }) {
  const textClass = size === "sm" ? "text-sm font-bold text-gold-300" : "text-xl font-light leading-tight text-gold-300 text-center mb-2";
  if (!value) return <span className={`text-gold-700 ${textClass}`}>—</span>;
  const parts = value.split(/(\{\{[\w.]+\}\})/g);
  return (
    <span className={textClass}>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{([\w.]+)\}\}$/);
        return match ? (
          <span key={i} className="text-gold-400 text-xs font-mono bg-gold-500/10 rounded px-1">{match[1]}</span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}
