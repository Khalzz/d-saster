import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import type { SectionSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function SectionSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as SectionSettings;

  return (
    <>
      <Field label="Title">
        <input
          type="text"
          value={s.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Section title"
          className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
        />
      </Field>
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
      <div className="mt-3">
        <Field label="Width">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={s.width ? String(s.width) : ""}
              onChange={(e) => {
                const v = e.target.value === "" ? 0 : Math.min(100, Math.max(0, Number(e.target.value) || 0));
                onChange({ width: v });
              }}
              placeholder="Auto"
              className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gold-700 pointer-events-none">%</span>
          </div>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Description">
          <textarea
            className="w-full rounded-md px-2.5 py-2 border border-gold-500/20 bg-base text-gold-200 text-xs resize-y outline-none focus:border-gold-500/40 transition-colors placeholder:text-gold-700"
            rows={3}
            placeholder="Tooltip text shown on hover…"
            value={s.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Field>
      </div>
    </>
  );
}
