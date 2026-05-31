import type { StatSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function StatPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { statKey, padding, width } = node.settings as StatSettings;
  const isSelected = selectedIds.has(node.id);

  const label = statKey ? statKey.slice(0, 3).toUpperCase() : "---";

  return (
    <div
      className="transition-colors cursor-pointer"
      style={{ padding, ...(width > 0 ? { width: `${width}%` } : { flex: "1 1 0%", minWidth: 0 }) }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <div className={`flex flex-col items-center gap-0.5 border rounded-lg pt-2 pb-1.5 px-1 select-none transition-colors ${
        isSelected ? "border-gold-400" : "border-gold-500/20"
      }`}>
        <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider truncate w-full text-center h-4 flex justify-center items-center">
          {label}
        </span>
        <span className="text-xl font-light leading-tight text-gold-300">
          +0
        </span>
        <input
          type="text"
          readOnly
          tabIndex={-1}
          value="10"
          className="w-full text-center outline-none text-gold-600 text-[11px] font-medium rounded-md px-0.5 bg-base hover:bg-gold-500/10 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
}
