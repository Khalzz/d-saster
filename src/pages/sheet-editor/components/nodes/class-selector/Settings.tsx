import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import type { ClassSelectorSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function ClassSelectorSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as ClassSelectorSettings;

  return (
    <>
      <div className="mb-3">
        <Field label="Label">
          <input
            type="text"
            value={s.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Class"
            className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
          />
        </Field>
      </div>
      <div className="mb-3">
        <Field label="Allow multiclass">
          <button
            type="button"
            className={`relative w-8! min-w-0! h-5! rounded-full! border-0! p-0! transition-colors cursor-pointer ${s.allowMulticlass ? "bg-gold-500!" : "bg-gold-500/20!"}`}
            onClick={() => onChange({ allowMulticlass: !s.allowMulticlass })}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${s.allowMulticlass ? "left-3.5 bg-base" : "left-0.5 bg-gold-700"}`} />
          </button>
        </Field>
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
