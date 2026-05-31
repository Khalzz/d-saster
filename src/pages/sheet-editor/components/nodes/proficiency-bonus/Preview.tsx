import type { ProficiencyBonusSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function ProficiencyBonusPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { padding, width } = node.settings as ProficiencyBonusSettings;
  const isSelected = selectedIds.has(node.id);

  return (
    <div
      className={`transition-colors cursor-pointer ${
        isSelected ? "outline-1 outline-offset-4 outline-gold-400" : ""
      }`}
      style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <div className="flex items-center gap-2 rounded-lg border border-gold-500/20 bg px-3 py-2">
        <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          Proficiency Bonus
        </span>
        <span className="ml-auto text-gold-300 text-sm font-bold">+2</span>
      </div>
    </div>
  );
}
