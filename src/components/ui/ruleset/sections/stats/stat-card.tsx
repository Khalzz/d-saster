import { Trash2 } from "lucide-react";
import { StatDefinition } from "../../../../../pages/ruleset/ruleset-editor";
import Card from "../../../card/card";
import { Markdown } from "../../../Markdown";

export function StatCard({ stat, onEdit, onDelete }: { stat: StatDefinition; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="group cursor-pointer hover:border-gold-500/40! transition-colors bg-transparent! border-transparent!" onClick={onEdit}>
      <button
        type="button"
        className="absolute top-2.5 right-2.5 w-6! h-6! min-w-0! p-0! shrink-0 bg-[#ef4444]/10! border-0! rounded-md! text-[#ef4444]! opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <p className="text-gold-300 font-semibold mb-1 pr-6">{stat.label || "Unnamed stat"}</p>
      {stat.description && <Markdown className="text-xs">{stat.description}</Markdown>}
    </Card>
  );
}