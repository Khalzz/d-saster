import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { AutoStatsSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import { AutoStatCell } from "./auto-stat-cell";

export function AutoStatsNode({ node, useSheet }: { node: LayoutNode, useSheet: () => SheetContext }) {
  const { columns, padding, gap, width, statKeys } = node.settings as AutoStatsSettings;
  const { char, onChange, statDefs, ruleset } = useSheet();
  
  const displayDefs = statKeys && statKeys.length > 0
    ? statDefs.filter(d => statKeys.includes(d.key))
    : statDefs;

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: '100%' }) }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {displayDefs.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-3">
            <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
              No stats in ruleset
            </span>
          </div>
        ) : (
          displayDefs.map((def) => (
            <AutoStatCell key={def.key} def={def} char={char} onChange={onChange} formula={ruleset?.modifierFormula} />
          ))
        )}
      </div>
    </div>
  );
}