import { Trash2 } from "lucide-react";
import Card from "../../../card/card";
import { Markdown } from "../../../Markdown";
import type { RulesetRule } from "../../../../../pages/ruleset/ruleset-editor";

export function RuleCard({ rule, onEdit, onDelete }: {
  rule: RulesetRule;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className="group cursor-pointer hover:border-gold-500/40! transition-colors ml-2"
      onClick={onEdit}
    >
      <button
        type="button"
        className="absolute top-2.5 right-2.5 w-6! h-6! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <p className="text-gold-300 font-semibold mb-1 pr-6">{rule.name || "Unnamed rule"}</p>
      {rule.description && <Markdown className="text-xs">{rule.description}</Markdown>}
    </Card>
  );
}
