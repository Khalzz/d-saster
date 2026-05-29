import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Star } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
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
  const cellRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const showTooltip = () => {
    if (cellRef.current) {
      const r = cellRef.current.getBoundingClientRect();
      setTooltipPos({ x: r.left + r.width / 2, y: r.top - 8 });
    }
  };

  const effectiveProf = proficient ? proficiencyBonus : 0;
  const value = calcSkill(skillFormula, statPoints, modifierFormula, effectiveProf, level);

  return (
    <div
      ref={cellRef}
      className="flex items-center gap-2 border justify-between border-gold-500/20 rounded-lg px-2 py-1 select-none"
      onMouseEnter={showTooltip}
      onMouseLeave={() => setTooltipPos(null)}
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

      {tooltipPos && createPortal(
        <div
          style={{ position: "fixed", left: tooltipPos.x, top: tooltipPos.y, transform: "translate(-50%, -100%)", zIndex: 9999 }}
          className="pointer-events-none bg-surface border border-gold-500/30 rounded-lg px-3 py-2 shadow-xl w-max max-w-64"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-gold-300 text-xs font-medium">{skill.name}</p>
            {proficient && <span className="text-gold-600 text-[9px] font-semibold uppercase tracking-wider">proficient</span>}
          </div>
          {skill.description && (
            <div className="text-[10px] text-gold-600 mt-0.5 [&>p]:leading-snug [&>p]:mb-2 [&>p:last-child]:mb-0 [&_li]:leading-snug [&_li_p]:my-0 [&_strong]:text-gold-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-3 [&_h1]:text-gold-300 [&_h1]:font-bold [&_h2]:text-gold-400 [&_h2]:font-semibold">
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>{skill.description}</ReactMarkdown>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
