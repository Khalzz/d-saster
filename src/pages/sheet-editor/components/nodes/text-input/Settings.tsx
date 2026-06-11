import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import type { TextInputSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function TextInputSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as TextInputSettings;

  return (
    <>
      <div className="mb-3">
        <Field label="Label">
          <input
            type="text"
            value={s.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Field label"
            className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
          />
        </Field>
      </div>
      <div className="mb-3">
        <Field label="Placeholder">
          <input
            type="text"
            value={s.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Placeholder text"
            className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
          />
        </Field>
      </div>
      <div className="mb-3">
        <Field label="Input type">
          <div className="flex rounded-md overflow-hidden border border-gold-500/30">
            {(["Single line", "Textarea"] as const).map((opt) => {
              const active = opt === "Textarea" ? s.multiline : !s.multiline;
              return (
                <button
                  key={opt}
                  onClick={() => onChange({ multiline: opt === "Textarea" })}
                  className={`flex-1! h-7! text-xs! rounded-none! border-0! border-r! last:border-r-0! border-gold-500/30!
                    ${active ? "bg-gold-500/20! text-gold-300!" : "bg-transparent! text-gold-600!"}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Field>
      </div>
      <div className="mb-3">
        <NumberField
          label="Width"
          value={s.width}
          onChange={(v) => onChange({ width: v })}
          min={0}
          max={100}
          suffix="%"
        />
      </div>
      <NumberField
        label="Padding"
        value={s.padding}
        onChange={(v) => onChange({ padding: v })}
        suffix="px"
      />
    </>
  );
}
