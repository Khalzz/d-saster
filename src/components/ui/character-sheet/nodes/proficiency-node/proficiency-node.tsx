import { useMemo } from "react";
import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { LayoutNode, ProficiencyBonusSettings } from "../../../../../pages/sheet-editor/types";
import { evalFormula } from "../../../../../pages/sheet-editor/handlebars";

export function ProficiencyBonusNode({ node, useSheet }: { node: LayoutNode; useSheet: () => SheetContext }) {
  const { formula, width, padding } = node.settings as ProficiencyBonusSettings;
  const { char, vars } = useSheet();

  const value = useMemo(() => {
    const defaultFormula = "Math.floor(({{level}} - 1) / 4) + 2";
    const f = formula || defaultFormula;
    const result = parseInt(evalFormula(f, vars));
    return isNaN(result) ? char.proficiencyBonus : Math.floor(result);
  }, [formula, vars, char.proficiencyBonus]);

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}>
      <div className="flex items-center gap-2 rounded-lg border border-gold-500/20 bg px-3 py-2">
        <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          Proficiency Bonus
        </span>
        <span className="ml-auto text-gold-300 text-sm font-bold">
          +{value}
        </span>
      </div>
    </div>
  );
}