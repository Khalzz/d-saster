import { Trash2 } from "lucide-react";
import Card from "../../../card/card";
import { Markdown } from "../../../Markdown";
import type { RulesetClass, StatDefinition, RulesetSkill } from "../../../../../pages/ruleset/ruleset-editor";

export function ClassCard({ cls, stats, skills, onEdit, onDelete }: {
  cls: RulesetClass;
  stats: StatDefinition[];
  skills: RulesetSkill[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statLabel = (key: string) => stats.find(s => s.key === key)?.label ?? key;
  const skillName = (id: string) => skills.find(s => s.id === id)?.name ?? id;

  const items = [
    cls.primaryAbility                   && { label: "Primary Ability",     value: statLabel(cls.primaryAbility) },
    cls.hitDie                           && { label: "Hit Die",             value: cls.hitDie },
    cls.savingThrowProficiencies?.length && { label: "Saving Throws",       value: cls.savingThrowProficiencies.map(statLabel).join(", ") },
    cls.skillProficiencies?.options?.length && { label: "Skill Proficiencies", value: (() => {
      const sp = cls.skillProficiencies;
      const allSkills = sp.options.length === skills.length && skills.length > 0;
      return `Choose ${sp.count} from: ${allSkills ? "any skill" : sp.options.map(skillName).join(", ")}`;
    })() },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Card className="group cursor-pointer hover:border-gold-500/40 transition-colors" onClick={onEdit}>
      <button
        type="button"
        className="absolute top-2.5 right-2.5 w-6! h-6! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <p className="text-gold-300 font-semibold text-[1rem] pr-6 mb-1">{cls.name || "Unnamed class"}</p>
      {items.length > 0 && (
        <table className="w-full text-xs mb-2 border-collapse">
          <tbody>
            {items.map(item => (
              <tr key={item.label} className="border-b border-gold-500/10 last:border-0">
                <td className="text-gold-500 font-semibold pr-3 py-1 w-0 whitespace-nowrap">{item.label}</td>
                <td className="text-gold-600 py-1">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {cls.description && <Markdown className="text-xs">{cls.description}</Markdown>}
    </Card>
  );
}
