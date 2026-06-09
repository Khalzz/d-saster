import { useMemo } from "react";
import { AutoSavingThrowsSettings, AutoStatsSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import { calcModifier } from "../../../../../pages/character/components/StatCell";
import { resolveHandlebars } from "../../../../../pages/sheet-editor/handlebars";
import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { Star } from "lucide-react";

export function AutoSavingThrowsNode({ node, useSheet, useTree }: { node: LayoutNode, useSheet: () => SheetContext, useTree: () => LayoutNode[] }) {
  const { columns, padding, gap, formula, width } = node.settings as AutoSavingThrowsSettings;
  const { char, onChange, ruleset, statDefs, vars } = useSheet();
  const tree = useTree();

  // Collect stat keys from auto-stats nodes on the tree
  const statKeys = useMemo(() => {
    const keys: string[] = [];
    const walk = (nodes: LayoutNode[]) => {
      for (const n of nodes) {
        if (n.type === "auto-stats") {
          const s = n.settings as AutoStatsSettings;
          if (s.statKeys && s.statKeys.length > 0) {
            for (const k of s.statKeys) { if (!keys.includes(k)) keys.push(k); }
          } else {
            for (const d of statDefs) { if (!keys.includes(d.key)) keys.push(d.key); }
          }
        }
        walk(n.children);
      }
    };
    walk(tree);
    if (keys.length === 0) return statDefs.map(d => d.key);
    return keys;
  }, [tree, statDefs]);

  const evalSavingThrow = (statKey: string, proficient: boolean) => {
    const statVal = char.stats[statKey] ?? 10;
    const mod = parseInt(calcModifier(statVal, ruleset?.modifierFormula)) || 0;
    const profBonus = proficient ? char.proficiencyBonus : 0;
    const f = formula || "{{stat_mod}} + {{proficiency_bonus}}";

    try {
      const expr = resolveHandlebars(f, {
        ...vars,
        stat_mod: mod,
        stat_points: statVal,
        proficiency_bonus: profBonus,
      });
      // eslint-disable-next-line no-new-func
      const result = Math.floor(new Function(`return (${expr})`)() as number);
      return result >= 0 ? `+${result}` : `${result}`;
    } catch {
      const total = mod + profBonus;
      return total >= 0 ? `+${total}` : `${total}`;
    }
  };

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: '100%' }) }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {statKeys.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-3">
            <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
              No stats defined
            </span>
          </div>
        ) : (
          statKeys.map((key) => {
            const def = statDefs.find(d => d.key === key);
            const proficient = char.savingThrowProficiencies?.[key] ?? false;
            return (
              <div
                key={key}
                className="flex flex-col items-center gap-0.5 border border-gold-500/20 rounded-lg px-1.5 py-1.5 select-none cursor-pointer hover:border-gold-500/40 transition-colors"
                onClick={() => onChange({ savingThrowProficiencies: { ...char.savingThrowProficiencies, [key]: !proficient } })}
              >
                <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider w-full text-center h-4 flex justify-center items-center gap-1">
                  <Star className={`h-3 w-3 shrink-0 ${proficient ? "text-gold-400 fill-gold-400" : "text-gold-700"}`} />
                  {(def?.label ?? key).slice(0, 3).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-gold-300 text-center w-full">
                  {evalSavingThrow(key, proficient)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}