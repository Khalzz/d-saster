import type { StaticCounterSettings } from "../../../types";
import type { NodePreviewProps } from "../types";
import { StaticCounterBox, FormulaDisplay } from "../../../../../components/ui/character-sheet/nodes/count-node/static-counter-box";

export function StaticCounterPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const s = node.settings as StaticCounterSettings;
  const direction = s.direction ?? "vertical";
  const isSelected = selectedIds.has(node.id);

  return (
    <StaticCounterBox
      label={s.label || "Label"}
      direction={direction}
      shieldView={s.shieldView}
      width={s.width}
      height={s.height}
      padding={s.padding}
      isSelected={isSelected}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
    >
      <FormulaDisplay value={s.value ?? ""} size={direction === "horizontal" ? "sm" : "lg"} />
    </StaticCounterBox>
  );
}
