import { Star } from "lucide-react";
import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { calcModifier } from "../../../../../pages/character/components/StatCell";
import { RulesetSkill } from "../../../../../pages/ruleset/ruleset-editor";
import { resolveHandlebars } from "../../../../../pages/sheet-editor/handlebars";
import { AutoSkillsSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";


export function AutoSkillsNode({ node, useSheet }: { node: LayoutNode, useSheet: () => SheetContext }) {
  const { columns, padding, gap, width } = node.settings as AutoSkillsSettings;
  const { char, onChange, skills, statDefs, ruleset, vars } = useSheet();

  const evalSkillMod = (skill: RulesetSkill) => {
    const statVal = char.stats[skill.statKey] ?? 10;
    const mod = parseInt(calcModifier(statVal, ruleset?.modifierFormula)) || 0;
    const proficient = char.skillProficiencies[skill.id];
    const bonus = proficient ? char.proficiencyBonus : 0;

    if (ruleset?.skillFormula) {
      try {
        const expr = resolveHandlebars(ruleset.skillFormula, {
          ...vars,
          stat_mod: mod,
          stat_points: statVal,
          proficiency_bonus: bonus,
        });
        // eslint-disable-next-line no-new-func
        const result = Math.floor(new Function(`return (${expr})`)() as number);
        return result >= 0 ? `+${result}` : `${result}`;
      } catch { /* fall through */ }
    }
    const total = mod + bonus;
    return total >= 0 ? `+${total}` : `${total}`;
  };

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: '100%' }) }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {skills.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-3">
            <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
              No skills in ruleset
            </span>
          </div>
        ) : (
          skills.map((skill) => {
            const statDef = statDefs.find(d => d.key === skill.statKey);
            const proficient = char.skillProficiencies[skill.id] ?? false;
            return (
              <div
                key={skill.id}
                className="flex items-center gap-2 border border-gold-500/20 rounded-lg px-2 py-1 select-none justify-between cursor-pointer hover:border-gold-500/40 transition-colors"
                onClick={() => onChange({ skillProficiencies: { ...char.skillProficiencies, [skill.id]: !proficient } })}
              >
                <div className="flex items-center gap-1 min-w-0">
                  <Star className={`h-3 w-3 shrink-0 ${proficient ? "text-gold-400 fill-gold-400" : "text-gold-700"}`} />
                  <span className="text-gold-300 text-xs truncate">{skill.name || "—"}</span>
                  <span className="text-gold-600 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    ({(statDef?.label ?? skill.statKey).slice(0, 3).toUpperCase()})
                  </span>
                </div>
                <span className="text-gold-500 text-xs font-semibold shrink-0">{evalSkillMod(skill)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}