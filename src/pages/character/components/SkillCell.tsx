import { Star } from "lucide-react";
import Tooltip from "../../../components/ui/tooltip/Tooltip";
import type { RulesetSkill } from "../../ruleset/ruleset-editor";

export function calcSkill(
  skillFormula: string,
  statPoints: number,
  modifierFormula?: string,
  proficiencyBonus = 0,
  level = 1,
): string {
  try {
    const modRaw = modifierFormula?.includes("{{stat_points}}")
      // eslint-disable-next-line no-new-func
      ? (new Function(`return (${modifierFormula.replace(/\{\{stat_points\}\}/g, String(statPoints))})`)() as number)
      : (statPoints - 10) / 2;
    const statMod = Math.floor(modRaw);
    const expr = skillFormula
      .replace(/\{\{stat_points\}\}/g, String(statPoints))
      .replace(/\{\{stat_mod\}\}/g, String(statMod))
      .replace(/\{\{proficiency_bonus\}\}/g, String(proficiencyBonus))
      .replace(/\{\{level\}\}/g, String(level));
    // eslint-disable-next-line no-new-func
    const result = Math.floor(new Function(`return (${expr})`)() as number);
    return result >= 0 ? `+${result}` : `${result}`;
  } catch {
    return "?";
  }
}

export function SkillCell({ skill, statLabel, statPoints, skillFormula, modifierFormula, proficient, proficiencyBonus, level, onProficiencyToggle }: {
  skill: RulesetSkill;
  statLabel: string;
  statPoints: number;
  skillFormula: string;
  modifierFormula?: string;
  proficient: boolean;
  proficiencyBonus: number;
  level: number;
  onProficiencyToggle: () => void;
}) {
  const effectiveProf = proficient ? proficiencyBonus : 0;
  const value = calcSkill(skillFormula, statPoints, modifierFormula, effectiveProf, level);

  const content = (
    <div
      className="flex items-center gap-2 border justify-between border-gold-500/20 rounded-lg px-2 py-1 select-none"
    >
      <div className="flex flex-row items-center gap-1 min-w-0">
        <button
          className="w-4! h-4! min-w-0! p-0! bg-transparent! border-0! shrink-0 flex items-center justify-center"
          onClick={onProficiencyToggle}
          title={proficient ? "Proficient (click to remove)" : "Not proficient (click to add)"}
        >
          <Star
            className={`h-3 w-3 transition-colors ${proficient ? "fill-gold-400 text-gold-400" : "text-gold-700 hover:text-gold-500"}`}
          />
        </button>
        <span className="text-gold-300 text-xs truncate">{skill.name || "—"}</span>
        <span className="text-gold-600 text-[10px] font-bold uppercase tracking-wider shrink-0">
          ({statLabel.slice(0, 3).toUpperCase()})
        </span>
      </div>
      <span className={`rounded-md text-xs font-semibold shrink-0 text-right ${proficient ? "text-gold-300" : "text-gold-500"}`}>
        {value}
      </span>
    </div>
  );

  if (skill.description) {
    return (
      <Tooltip text={skill.description} title={skill.name} badge={proficient ? "proficient" : undefined}>
        {content}
      </Tooltip>
    );
  }

  return content;
}
