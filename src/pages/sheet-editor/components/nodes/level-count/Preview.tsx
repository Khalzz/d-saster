import { Minus, Plus } from "lucide-react";
import type { LevelCountSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function LevelCountPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { label, min, max, padding } = node.settings as LevelCountSettings;
  const isSelected = selectedIds.has(node.id);

  return (
    <div
      className={`rounded-xs transition-colors cursor-pointer w-fit ${
        isSelected ? "outline outline-1 outline-offset-4 outline-gold-400" : ""
      }`}
      style={{ padding }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <div className="flex flex-col shrink-0">
        <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          {label || "Level"}{" "}
          <span className="text-gold-700 text-[9px] font-normal normal-case tracking-normal">({max} max)</span>
        </label>
        <div className="flex w-fit rounded-lg overflow-hidden border border-gold-500/20 h-10">
          <button
            type="button"
            className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
            tabIndex={-1}
          >
            <Minus className="h-3 w-3" />
          </button>
          <div className="w-px bg-gold-500/20 shrink-0" />
          <input
            type="number"
            className="w-10 h-full text-sm font-light text-gold-300 text-center bg-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={min}
            readOnly
            tabIndex={-1}
          />
          <div className="w-px bg-gold-500/20 shrink-0" />
          <button
            type="button"
            className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
            tabIndex={-1}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
