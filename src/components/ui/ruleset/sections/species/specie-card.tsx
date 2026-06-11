import { Trash2 } from "lucide-react";
import type { RulesetSpecie, RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";
import { applyTraitFieldValues } from "../../../../../pages/ruleset/ruleset-editor";
import Card from "../../../card/card";
import { Markdown } from "../../../Markdown";

export function SpecieCard({ specie, traits, onEdit, onDelete }: {
  specie: RulesetSpecie;
  traits: RulesetSpecieTrait[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const resolvedTraits = (specie.traitAssignments ?? [])
    .map(a => ({ trait: traits.find(t => t.id === a.traitId), values: a.values }))
    .filter((x): x is { trait: RulesetSpecieTrait; values: Record<string, string> } => !!x.trait);

  const lines: string[] = [];

  if (specie.description) lines.push(specie.description);

  const movements = (specie.movements ?? []).filter(m => m.label || m.value);
  const senses    = (specie.senses    ?? []).filter(s => s.label || s.value);
  const statsLine = [
    specie.size.length > 0 ? `**Size:** ${specie.size.join(" or ")}` : null,
    ...[...movements, ...senses].map(x => `**${x.label}:** ${x.value} ${specie.unit}`),
  ].filter(Boolean).join(" · ");
  if (statsLine) lines.push(statsLine);

  const statMods = Object.entries(specie.statModifiers ?? {}).filter(([, v]) => v !== 0);
  if (statMods.length > 0)
    lines.push(`**Stats:** ${statMods.map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${k}`).join(", ")}`);

  const resistanceParts = [
    specie.damageResistances?.length     && `**Resistances:** ${specie.damageResistances.join(", ")}`,
    specie.damageImmunities?.length      && `**Damage Immunities:** ${specie.damageImmunities.join(", ")}`,
    specie.conditionImmunities?.length   && `**Condition Immunities:** ${specie.conditionImmunities.join(", ")}`,
    specie.damageVulnerabilities?.length && `**Vulnerabilities:** ${specie.damageVulnerabilities.join(", ")}`,
  ].filter(Boolean) as string[];
  if (resistanceParts.length > 0) lines.push(resistanceParts.join("\n\n"));

  const mainMarkdown = lines.join("\n\n");

  return (
    <Card className="group cursor-pointer hover:border-gold-500/40 transition-colors p-3" onClick={onEdit}>
      <button
        type="button"
        className="absolute top-2.5 right-2.5 w-6! h-6! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <p className="text-gold-300 font-semibold text-lg pr-6">{specie.name || "Unnamed specie"}</p>
      {mainMarkdown && <Markdown className="text-xs">{mainMarkdown}</Markdown>}
      {resolvedTraits.length > 0 && (
        <div className="mt-1">
          <Markdown className="text-xs mb-0">{"## Traits"}</Markdown>
          <div className="pl-3 flex flex-col gap-2">
            {resolvedTraits.map(({ trait, values }) => {
              const fieldParts = (trait.fields ?? [])
                .filter(f => values[f.id])
                .map(f => `${f.label}: ${values[f.id]}`);
              const desc = trait.description
                ? applyTraitFieldValues(trait.description, trait.fields ?? [], values)
                : "";
              return (
                <div key={trait.id} className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-gold-300 text-sm font-semibold">{trait.name}</span>
                    {fieldParts.length > 0 && (
                      <span className="text-gold-600 text-xs">({fieldParts.join(", ")})</span>
                    )}
                  </div>
                  {desc && <Markdown className="text-xs">{desc}</Markdown>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
