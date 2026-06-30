import { Markdown } from "../../../Markdown";
import type { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import type { FeaturesAndTraitsSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import type { RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";
import { applyTraitFieldValues } from "../../../../../pages/ruleset/ruleset-editor";

function TraitCard({ trait, values = {} }: { trait: RulesetSpecieTrait; values?: Record<string, string> }) {
  const fields = (trait.fields ?? []).map(f => `\`${f.label}: ${values[f.id] ?? "—"}\``).join(" ");
  const header = `## ${trait.name || "—"}${fields ? `  ${fields}` : ""}`;
  const body = trait.description ? applyTraitFieldValues(trait.description, trait.fields ?? [], values) : "";
  const content = [header, body].filter(Boolean).join("\n\n");

  return (
    <div className="border border-gold-500/20 rounded-lg p-2">
      <Markdown>{content}</Markdown>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-gold-600">{label}</span>
      <div className="flex-1 h-px bg-gold-500/10" />
    </div>
  );
}

export function FeaturesAndTraitsNode({ node, useSheet }: { node: LayoutNode; useSheet: () => SheetContext }) {
  const { padding, width } = node.settings as FeaturesAndTraitsSettings;
  const { char, ruleset, vars } = useSheet();
  const rawLevel = vars["level"] ?? char.level ?? 0;
  const charLevel = Math.floor(Number(rawLevel));

  const specieTraits: { trait: RulesetSpecieTrait; values: Record<string, string> }[] = (() => {
    const specie = ruleset?.species?.find(s => s.id === char.race);
    if (!specie) return [];
    return (specie.traitAssignments ?? [])
      .map(a => ({ trait: ruleset?.traits?.find(t => t.id === a.traitId), values: a.values ?? {} }))
      .filter((x): x is { trait: RulesetSpecieTrait; values: Record<string, string> } => !!x.trait);
  })();

  const classTraitGroups: { className: string; levels: { level: number; traits: RulesetSpecieTrait[] }[] }[] = (() => {
    if (!ruleset) return [];

    const resolve = (classId: string, maxLevel: number) => {
      const cls = ruleset.classes?.find(c => c.id === classId);
      if (!cls) return null;

      const levelMap = new Map<number, RulesetSpecieTrait[]>();
      const seen = new Set<string>();

      const ft = cls.featureTable;
      const levelCol = ft?.columns[0];
      const traitCols = ft?.columns.filter(c => c.type === "traits") ?? [];

      if (ft && levelCol && traitCols.length > 0) {
        ft.rows
          .filter(row => {
            const n = parseFloat((row.cells[levelCol.id] as string) ?? "");
            return !isNaN(n) && n <= maxLevel;
          })
          .sort((a, b) =>
            parseFloat((a.cells[levelCol.id] as string) ?? "0") -
            parseFloat((b.cells[levelCol.id] as string) ?? "0")
          )
          .forEach(row => {
            const lvNum = parseFloat((row.cells[levelCol.id] as string) ?? "0");
            const bucket: RulesetSpecieTrait[] = [];
            traitCols.forEach(col => {
              ((row.cells[col.id] as string[] | undefined) ?? []).forEach(id => {
                if (!seen.has(id)) {
                  seen.add(id);
                  const t = ruleset.traits?.find(t => t.id === id);
                  if (t) bucket.push(t);
                }
              });
            });
            if (bucket.length > 0) levelMap.set(lvNum, (levelMap.get(lvNum) ?? []).concat(bucket));
          });
      } else {
        (cls.levelFeatures ?? [])
          .filter(lf => lf.level <= maxLevel)
          .sort((a, b) => a.level - b.level)
          .forEach(lf => {
            const bucket: RulesetSpecieTrait[] = [];
            lf.traitIds.forEach(id => {
              if (!seen.has(id)) {
                seen.add(id);
                const t = ruleset.traits?.find(t => t.id === id);
                if (t) bucket.push(t);
              }
            });
            if (bucket.length > 0) levelMap.set(lf.level, (levelMap.get(lf.level) ?? []).concat(bucket));
          });
      }

      if (levelMap.size === 0) return null;
      const levels = [...levelMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([level, traits]) => ({ level, traits }));
      return { className: cls.name, levels };
    };

    const mc = char.multiclass ?? [];
    const allEntries = (() => {
      const ids = mc.map(m => m.classId);
      if (char.classId && !ids.includes(char.classId)) {
        const derived = Math.max(0, charLevel - mc.reduce((s, m) => s + m.level, 0));
        return [{ classId: char.classId, level: derived }, ...mc];
      }
      return mc;
    })();

    const groups: { className: string; levels: { level: number; traits: RulesetSpecieTrait[] }[] }[] = [];
    if (charLevel > 0) {
      allEntries.forEach(entry => { if (entry.level > 0) { const g = resolve(entry.classId, entry.level); if (g) groups.push(g); } });
    }
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
        <div className="flex flex-col gap-4">
          {specieTraits.length > 0 && (
            <div className="flex flex-col gap-2">
              <SectionLabel label="Specie Traits" />
              {specieTraits.map(({ trait, values }) => (
                <TraitCard key={trait.id} trait={trait} values={values} />
              ))}
            </div>
          )}
          {classTraitGroups.map(({ className, levels }) => (
            <div key={className} className="flex flex-col">
              <SectionLabel label={`${className} Features`} />
              {levels.map(({ level, traits }) => (
                <div key={level} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-gold-500/60 shrink-0">Level {level}</span>
                    <div className="flex-1 h-px bg-gold-500/8" />
                  </div>
                  {traits.map((trait: RulesetSpecieTrait) => (
                    <TraitCard key={trait.id} trait={trait} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
