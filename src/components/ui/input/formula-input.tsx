import { AlertCircle, Check, Info } from "lucide-react";
import { useRef, useState } from "react";
import { HandlebarInput } from "../../../pages/sheet-editor/components/nodes/HandlebarInput";
import { createPortal } from "react-dom";

export function FormulaInput({
  label = "Formula",
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const infoRef = useRef<HTMLButtonElement>(null);
  const warnRef = useRef<SVGSVGElement>(null);
  const checkRef = useRef<SVGSVGElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [statusTooltip, setStatusTooltip] = useState<{ top: number; left: number; type: "warn" | "ok" } | null>(null);

  const opens  = (value.match(/\{\{/g)  ?? []).length;
  const closes = (value.match(/\}\}/g) ?? []).length;
  const balanced = opens === closes;
  const valid = value.length > 0 && balanced;
  const warn  = value.length > 0 && !balanced;

  const showStatusTooltip = (ref: React.RefObject<SVGSVGElement | null>, type: "warn" | "ok") => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setStatusTooltip({ top: r.bottom + 6, left: r.left, type });
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-gold-400 text-sm font-semibold">{label}</span>
          <button
            ref={infoRef}
            className="w-4! h-4! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-gold-500! shrink-0"
            onMouseEnter={() => {
              const r = infoRef.current?.getBoundingClientRect();
              if (r) setTooltipPos({ top: r.bottom + 6, left: r.left });
            }}
            onMouseLeave={() => setTooltipPos(null)}
          >
            <Info className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <HandlebarInput
            value={value}
            onChange={onChange}
            placeholder={placeholder ?? "Enter formula…"}
          />
          {valid && (
            <Check
              ref={checkRef}
              className="h-3.5 w-3.5 text-emerald-500 shrink-0 cursor-default"
              onMouseEnter={() => showStatusTooltip(checkRef, "ok")}
              onMouseLeave={() => setStatusTooltip(null)}
            />
          )}
          {warn && (
            <AlertCircle
              ref={warnRef}
              className="h-3.5 w-3.5 text-amber-500 shrink-0 cursor-default"
              onMouseEnter={() => showStatusTooltip(warnRef, "warn")}
              onMouseLeave={() => setStatusTooltip(null)}
            />
          )}
        </div>
      </div>

      {tooltipPos && createPortal(
        <div
          style={{ position: "fixed", top: tooltipPos.top, left: tooltipPos.left, zIndex: 999 }}
          className="bg-surface border border-gold-500/30 rounded-lg px-3 py-2 shadow-xl max-w-56 pointer-events-none"
        >
          <p className="text-gold-400 text-[11px] font-medium mb-1">Handlebars formula</p>
          <p className="text-gold-600 text-[10px] leading-relaxed">
            Write a math expression using <code className="text-gold-300 font-mono bg-gold-500/10 px-0.5 rounded">{"{{variable}}"}</code> syntax. Type <code className="text-gold-300 font-mono bg-gold-500/10 px-0.5 rounded">{"{{"}</code> to pick a variable.
          </p>
        </div>,
        document.body
      )}

      {statusTooltip && createPortal(
        <div
          style={{ position: "fixed", top: statusTooltip.top, left: statusTooltip.left, zIndex: 999 }}
          className="bg-surface border rounded-lg px-3 py-2 shadow-xl max-w-64 pointer-events-none border-gold-500/30"
        >
          {statusTooltip.type === "warn" ? (
            <>
              <p className="text-amber-400 text-[11px] font-medium mb-1">Unclosed handlebars</p>
              <p className="text-gold-600 text-[10px] leading-relaxed">
                Every <code className="text-gold-300 font-mono bg-gold-500/10 px-0.5 rounded">{"{{"}  </code> must be closed with <code className="text-gold-300 font-mono bg-gold-500/10 px-0.5 rounded">{"}}"}</code>.
              </p>
            </>
          ) : (
            <>
              <p className="text-emerald-400 text-[11px] font-medium mb-1">Formula looks good</p>
              <p className="text-gold-600 text-[10px] leading-relaxed">
                All handlebars are balanced — variables will be substituted at runtime.
              </p>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
