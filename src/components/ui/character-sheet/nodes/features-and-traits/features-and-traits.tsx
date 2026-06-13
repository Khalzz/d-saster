import { Markdown } from "../../../Markdown";
import type { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import type { FeaturesAndTraitsSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import type { RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";
import { applyTraitFieldValues } from "../../../../../pages/ruleset/ruleset-editor";

function TraitCard({ trait, values = {} }: { trait: RulesetSpecieTrait; values?: Record<string, string> }) {
  return (
    <div className="border border-gold-500/20 rounded-lg px-3 py-2 flex flex-col gap-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gold-300 text-xs font-medium leading-tight">
          {trait.name || "—"}
        </span>
        {(trait.fields ?? []).map(f => (
          <span key={f.id} className="text-[10px] text-gold-600">
            {f.label}:{" "}
            <span className="text-gold-400">{values[f.id] ?? "—"}</span>
          </span>
        ))}
      </div>
      {trait.description && (
        <Markdown className="text-[11px]">{applyTraitFieldValues(trait.description, trait.fields ?? [], values)}</Markdown>
      )}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-gold-600">{label}</span>
      <div className="flex-1 h-px bg-gold-500/10" />
    </div>
  );
}

export function FeaturesAndTraitsNode({ node, useSheet }: { node: LayoutNode; useSheet: () => SheetContext }) {
  const { padding, width } = node.settings as FeaturesAndTraitsSettings;
  const { char, ruleset } = useSheet();

  const specieTraits: { trait: RulesetSpecieTrait; values: Record<string, string> }[] = (() => {
    const specie = ruleset?.species?.find(s => s.id === char.race);
    if (!specie) return [];
    return (specie.traitAssignments ?? [])
      .map(a => ({ trait: ruleset?.traits?.find(t => t.id === a.traitId), values: a.values ?? {} }))
      .filter((x): x is { trait: RulesetSpecieTrait; values: Record<string, string> } => !!x.trait);
  })();

  const classTraitGroups: { className: string; traits: RulesetSpecieTrait[] }[] = (() => {
    if (!ruleset) return [];

    const resolve = (classId: string, level: number) => {
      const cls = ruleset.classes?.find(c => c.id === classId);
      if (!cls) return null;
      const seen = new Set<string>();
      const traits: RulesetSpecieTrait[] = [];

      const ft = cls.featureTable;
      const levelCol = ft?.columns[0];
      const traitCols = ft?.columns.filter(c => c.type === "traits") ?? [];

      if (ft && levelCol && traitCols.length > 0) {
        ft.rows
          .filter(row => {
            const n = parseFloat((row.cells[levelCol.id] as string) ?? "");
            return !isNaN(n) && n <= level;
          })
          .sort((a, b) =>
            parseFloat((a.cells[levelCol.id] as string) ?? "0") -
            parseFloat((b.cells[levelCol.id] as string) ?? "0")
          )
          .forEach(row => {
            traitCols.forEach(col => {
              ((row.cells[col.id] as string[] | undefined) ?? []).forEach(id => {
                if (!seen.has(id)) {
                  seen.add(id);
                  const t = ruleset.traits?.find(t => t.id === id);
                  if (t) traits.push(t);
                }
              });
            });
          });
      } else {
        (cls.levelFeatures ?? [])
          .filter(lf => lf.level <= level)
          .sort((a, b) => a.level - b.level)
          .forEach(lf => lf.traitIds.forEach(id => {
            if (!seen.has(id)) {
              seen.add(id);
              const t = ruleset.traits?.find(t => t.id === id);
              if (t) traits.push(t);
            }
          }));
      }

      return traits.length > 0 ? { className: cls.name, traits } : null;
    };

    const groups: { className: string; traits: RulesetSpecieTrait[] }[] = [];
    if (char.classId) { const g = resolve(char.classId, char.level); if (g) groups.push(g); }
    (char.multiclass ?? []).forEach(mc => { const g = resolve(mc.classId, mc.level); if (g) groups.push(g); });
    return groups;
  })();

  const hasAny = specieTraits.length > 0 || classTraitGroups.length > 0;

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}>
      {!hasAny ? (
        <div className="flex items-center justify-center py-3">
          <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
            No features or traits found
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {specieTraits.length > 0 && (
            <div className="flex flex-col gap-2">
              <SectionLabel label="Specie Traits" />
              {specieTraits.map(({ trait, values }) => (
                <TraitCard key={trait.id} trait={trait} values={values} />
              ))}
            </div>
          )}
          {classTraitGroups.map(({ className, traits }) => (
            <div key={className} className="flex flex-col gap-2">
              <SectionLabel label={`${className} Features`} />
              {traits.map(trait => (
                <TraitCard key={trait.id} trait={trait} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
