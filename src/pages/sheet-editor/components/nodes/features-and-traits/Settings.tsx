import { NumberField } from "../shared";
import type { FeaturesAndTraitsSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function FeaturesAndTraitsSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as FeaturesAndTraitsSettings;

  return (
    <>
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
