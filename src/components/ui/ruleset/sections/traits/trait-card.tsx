import { Trash2 } from "lucide-react";
import Card from "../../../card/card";
import { Markdown } from "../../../Markdown";
import type { RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";

export function TraitCard({ trait, onEdit, onDelete }: {
  trait: RulesetSpecieTrait;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group cursor-pointer hover:border-gold-500/40 transition-colors" onClick={onEdit}>
      <button
        type="button"
        className="absolute top-2.5 right-2.5 w-6! h-6! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <p className="text-gold-300 font-semibold text-base mb-1 pr-6">{trait.name || "Unnamed trait"}</p>
      {trait.description && <Markdown className="text-xs">{trait.description}</Markdown>}
    </Card>
  );
}
