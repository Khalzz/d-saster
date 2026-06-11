import { useEffect, useRef } from "react";
import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { LayoutNode, TextInputSettings } from "../../../../../pages/sheet-editor/types";
import { labelToVar } from "../../../../../pages/sheet-editor/handlebars";

const MAX_TEXTAREA_HEIGHT = 240;

export function TextInputNode({ node, useSheet }: { node: LayoutNode, useSheet: () => SheetContext }) {
  const { label, placeholder, padding, width, multiline } = node.settings as TextInputSettings;
  const { char, onChange } = useSheet();
  const key = labelToVar(label);
  const value = char.customFields?.[key] as string ?? "";
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ customFields: { ...char.customFields, [key]: e.target.value } });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [value]);

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}>
      <div className="flex flex-col">
        <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          {label || "Label"}
        </label>
        {multiline ? (
          <textarea
            ref={textareaRef}
            placeholder={placeholder || "Text input"}
            value={value}
            onChange={handleChange}
            style={{ overflowY: "hidden" }}
          />
        ) : (
          <input
            className="py-1"
            placeholder={placeholder || "Text input"}
            value={value}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  );
}
