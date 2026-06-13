import { Trash2 } from "lucide-react";
import type { RulesetSkill, StatDefinition } from "../../../../../pages/ruleset/ruleset-editor";
import Card from "../../../card/card";
import { Markdown } from "../../../Markdown";

export function SkillCard({ skill, stats, onEdit, onDelete }: {
  skill: RulesetSkill;
  stats: StatDefinition[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const linkedStat = stats.find(s => s.key === skill.statKey);

  return (
    <Card className="group cursor-pointer hover:border-gold-500/40! transition-colors px-4 py-3" onClick={onEdit}>
      <button
        type="button"
        className="absolute top-2.5 right-2.5 w-6! h-6! min-w-0! p-0! shrink-0 bg-[#ef4444]/10! border-0! rounded-md! text-[#ef4444]! opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-baseline gap-2 pr-6 mb-1">
        <p className="text-gold-300 font-semibold">{skill.name || "Unnamed skill"}</p>
        {linkedStat && (
          <span className="text-gold-600 text-xs bg-gold-900/20! border border-gold-500/30! px-2! leading-5 rounded-full!">
            {linkedStat.label}
          </span>
        )}
      </div>
      {skill.description && <Markdown className="text-xs">{skill.description}</Markdown>}
    </Card>
  );
}
