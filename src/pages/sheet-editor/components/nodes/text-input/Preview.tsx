import type { TextInputSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function TextInputPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { label, placeholder, padding } = node.settings as TextInputSettings;
  const isSelected = selectedIds.has(node.id);

  return (
    <div
      className={`rounded-xs transition-colors cursor-pointer w-full ${
        isSelected
          ? "outline outline-offset-2 outline-gold-400"
          : ""
      }`}
      style={{ padding }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <div className="flex flex-col">
        <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          {label || "Label"}
        </label>
        <input
          className="field-input h-10 py-1"
          readOnly
          placeholder={placeholder || "Text input"}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
