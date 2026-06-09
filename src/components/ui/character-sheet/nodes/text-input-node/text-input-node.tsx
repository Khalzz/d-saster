import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { LayoutNode, TextInputSettings } from "../../../../../pages/sheet-editor/types";
import { labelToVar } from "../../../../../pages/sheet-editor/handlebars";

export function TextInputNode({ node, useSheet }: { node: LayoutNode, useSheet: () => SheetContext }) {
  const { label, placeholder, padding, width } = node.settings as TextInputSettings;
  const { char, onChange } = useSheet();
  const key = labelToVar(label);

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}>
      <div className="flex flex-col">
        <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          {label || "Label"}
        </label>
        <input
          className="py-1"
          placeholder={placeholder || "Text input"}
          value={char.customFields?.[key] as string ?? ""}
          onChange={(e) => onChange({ customFields: { ...char.customFields, [key]: e.target.value } })}
        />
      </div>
    </div>
  );
}
