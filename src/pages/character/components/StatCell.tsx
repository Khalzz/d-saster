import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { StatDefinition } from "../../ruleset/ruleset-editor";

export function calcModifier(val: number, formula?: string): string {
  if (formula?.includes("{{stat_points}}")) {
    try {
      const expr = formula.replace(/\{\{stat_points\}\}/g, String(val));
      // eslint-disable-next-line no-new-func
      const result = Math.floor(new Function(`return (${expr})`)() as number);
      return result >= 0 ? `+${result}` : `${result}`;
    } catch {
      return "?";
    }
  }
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function StatCell({ def, val, formula, onChange }: {
  def: StatDefinition;
  val: number;
  formula?: string;
  onChange: (raw: string) => void;
}) {
  const cellRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [inputVal, setInputVal] = useState(String(val));

  useEffect(() => { setInputVal(String(val)); }, [val]);

  const showTooltip = () => {
    if (cellRef.current) {
      const r = cellRef.current.getBoundingClientRect();
      setTooltipPos({ x: r.left + r.width / 2, y: r.top - 8 });
    }
  };

  return (
    <div
      ref={cellRef}
      className="flex flex-col items-center gap-0.5 border border-gold-500/20 rounded-lg pt-2 pb-1.5 px-1 cursor-pointer select-none"
      onMouseEnter={showTooltip}
      onMouseLeave={() => setTooltipPos(null)}
    >
      <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider truncate w-full text-center">
        {def.label.slice(0, 3).toUpperCase()}
      </span>
      <span className="text-xl font-light leading-tight text-gold-300">
        {calcModifier(val, formula)}
      </span>
      <input
        type="number"
        min={1}
        max={30}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(e.currentTarget.value); e.currentTarget.blur(); } }}
        className="w-full text-center outline-none text-gold-600 text-[11px] font-medium rounded-md px-0.5 transition-colors bg-base hover:bg-gold-500/10 cursor-pointer select-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {tooltipPos && createPortal(
        <div
          style={{ position: "fixed", left: tooltipPos.x, top: tooltipPos.y, transform: "translate(-50%, -100%)", zIndex: 9999 }}
          className="pointer-events-none bg-surface border border-gold-500/30 rounded-lg px-3 py-2 shadow-xl w-max max-w-64"
        >
          <p className="text-gold-300 text-xs font-medium">{def.label}</p>
          {def.description && (
            <div className="text-[10px] text-gold-600 mt-0.5 [&>p]:leading-snug [&>p]:mb-2 [&>p:last-child]:mb-0 [&_li]:leading-snug [&_li_p]:my-0 [&_strong]:text-gold-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-3 [&_h1]:text-gold-300 [&_h1]:font-bold [&_h2]:text-gold-400 [&_h2]:font-semibold">
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>{def.description}</ReactMarkdown>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
