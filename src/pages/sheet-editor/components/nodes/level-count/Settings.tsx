import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import type { LevelCountSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function LevelCountSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as LevelCountSettings;

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
      <NumberField
        label="Min"
        value={s.min}
        onChange={(v) => onChange({ min: v })}
      />
      <NumberField
        label="Max"
        value={s.max}
        onChange={(v) => onChange({ max: v })}
        min={1}
      />
      <NumberField
        label="Padding"
        value={s.padding}
        onChange={(v) => onChange({ padding: v })}
        suffix="px"
      />
    </>
  );
}
