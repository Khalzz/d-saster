import { Minus, Plus } from "lucide-react";
import type { CounterSettings } from "../../../types";
import type { NodePreviewProps } from "../types";
import { StaticCounterBox, FormulaDisplay } from "./StaticCounterBox";

export function CounterPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const s = node.settings as CounterSettings;
  const { label, max, hasMax, isStatic, staticValue, padding } = s;
  const isSelected = selectedIds.has(node.id);

  if (isStatic) {
    return (
      <StaticCounterBox
        label={label}
        shieldView={s.shieldView}
        width={s.width}
        height={s.height}
        padding={padding}
        isSelected={isSelected}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
      >
        <FormulaDisplay value={staticValue ?? ""} />
      </StaticCounterBox>
    );
  }

  const wrapperClass = `rounded-xs transition-colors cursor-pointer w-fit ${
    isSelected ? "outline outline-1 outline-offset-4 outline-gold-400" : ""
  }`;

  return (
    <div className={wrapperClass} style={{ padding }} onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}>
      <div className="flex flex-col shrink-0">
        <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          {label || "Counter"}
          {hasMax && (
            <span className="text-gold-700 text-[9px] font-normal normal-case tracking-normal"> ({max} max)</span>
          )}
        </label>
        <div className="flex w-fit rounded-lg overflow-hidden border border-gold-500/20 h-10">
          <button type="button" className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0" tabIndex={-1}>
            <Minus className="h-3 w-3" />
          </button>
          <div className="w-px bg-gold-500/20 shrink-0" />
          <input
            type="number"
            className="w-10 h-full text-sm font-light text-gold-300 text-center bg-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={0}
            readOnly
            tabIndex={-1}
          />
          <div className="w-px bg-gold-500/20 shrink-0" />
          <button type="button" className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0" tabIndex={-1}>
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
