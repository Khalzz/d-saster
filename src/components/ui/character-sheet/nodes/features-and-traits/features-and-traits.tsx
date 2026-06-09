import { Markdown } from "../../../Markdown";
import type { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import type { FeaturesAndTraitsSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import type { RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";

export function FeaturesAndTraitsNode({ node, useSheet }: { node: LayoutNode; useSheet: () => SheetContext }) {
  const { padding, width } = node.settings as FeaturesAndTraitsSettings;
  const { char, ruleset } = useSheet();

  const specieTraits: RulesetSpecieTrait[] = (() => {
    const specie = ruleset?.species?.find(s => s.id === char.race);
    if (!specie || !specie.traitIds?.length) return [];
    return specie.traitIds
      .map(id => ruleset?.traits?.find(t => t.id === id))
      .filter((t): t is RulesetSpecieTrait => !!t);
  })();

  const hasAny = specieTraits.length > 0;

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
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-gold-600">
                  Specie Traits
                </span>
                <div className="flex-1 h-px bg-gold-500/10" />
              </div>
              <div className="flex flex-col gap-2">
                {specieTraits.map(trait => (
                  <div
                    key={trait.id}
                    className="border border-gold-500/20 rounded-lg px-3 py-2 flex flex-col gap-0.5"
                  >
                    <span className="text-gold-300 text-xs font-medium leading-tight">
                      {trait.name || "—"}
                    </span>
                    {trait.description && (
                      <Markdown className="text-[11px]">{trait.description}</Markdown>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
