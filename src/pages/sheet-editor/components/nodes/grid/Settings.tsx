import { NumberField } from "../shared";
import type { GridSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function GridSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as GridSettings;

  return (
    <>
      <NumberField
        label="Columns"
        value={s.columns}
        onChange={(v) => onChange({ columns: v })}
        min={1}
        max={12}
      />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <NumberField
          label="Padding"
          value={s.padding}
          onChange={(v) => onChange({ padding: v })}
          suffix="px"
        />
        <NumberField
          label="Gap"
          value={s.gap}
          onChange={(v) => onChange({ gap: v })}
          suffix="px"
        />
      </div>
    </>
  );
}
