import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import type { SpecieSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function SpecieSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as SpecieSettings;

  return (
    <>
      <div className="mb-3">
        <Field label="Label">
          <input
            type="text"
            value={s.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Specie"
            className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
          />
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
