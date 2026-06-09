import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { LayoutNode, SpecieSettings } from "../../../../../pages/sheet-editor/types";
import { Dropdown } from "../../../Dropdown";
import Field from "../../../Field";



export function SpecieNode({ node, useSheet }: { node: LayoutNode; useSheet: () => SheetContext }) {
  const { label, padding, width } = node.settings as SpecieSettings;
  const { char, onChange, ruleset } = useSheet();
  const species = ruleset?.species ?? [];

  return (
    <div className="w-full" style={{ padding, ...(width > 0 ? { width: `${width}%` } : {}) }}>
      <Field
        label={
          <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
            {label || "Specie"}
          </span>
        }
      >
        <Dropdown
          options={species.map((s) => ({ value: s.id, label: s.name || "Unnamed species" }))}
          value={char.race}
          onChange={(id) => onChange({ race: id })}
          placeholder="No species selected"
        />
      </Field>
    </div>
  );
}