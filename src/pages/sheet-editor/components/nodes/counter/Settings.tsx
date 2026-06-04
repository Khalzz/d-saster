import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import { HandlebarInput } from "../HandlebarInput";
import type { CounterSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => onChange(!checked)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-600">{label}</span>
      <div className={`relative w-7 h-4 rounded-full transition-colors ${checked ? "bg-gold-500" : "bg-gold-500/20"}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? "translate-x-3.5" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-gold-600/60 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-gold-500/15" />
    </div>
  );
}

export function CounterSettingsForm({ settings, onChange, availableVars }: NodeSettingsProps) {
  const s = settings as unknown as CounterSettings;

  return (
    <div className="flex flex-col">
      <Section label="General" />
      <Field label="Label">
        <input
          type="text"
          value={s.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Field label"
          className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
        />
      </Field>

      <Section label="Counter type" />
      <Toggle label="Static value" checked={s.isStatic} onChange={(v) => onChange({ isStatic: v })} />
      {s.isStatic && (
        <>
          <Field label="Value">
            <HandlebarInput
              value={s.staticValue ?? ""}
              onChange={(v) => onChange({ staticValue: v })}
              placeholder="{{level}}"
              extraVars={availableVars}
            />
          </Field>
          <Section label="Display" />
          <Toggle label="Shield view" checked={s.shieldView ?? false} onChange={(v) => onChange({ shieldView: v })} />
          <div className="grid grid-cols-2 gap-2 mt-1">
            <NumberField label="Width" value={s.width ?? 0} onChange={(v) => onChange({ width: v })} suffix="%" max={100} />
            <NumberField label="Height" value={s.height ?? 0} onChange={(v) => onChange({ height: v })} suffix="px" />
          </div>
        </>
      )}

      {!s.isStatic && (
        <>
          <Section label="Counter settings" />
          <Toggle label="Allow negative" checked={s.allowNegative} onChange={(v) => onChange({ allowNegative: v })} />
          <Toggle label="Has maximum" checked={s.hasMax} onChange={(v) => onChange({ hasMax: v })} />
          {s.hasMax && (
            <NumberField label="Max" value={s.max} onChange={(v) => onChange({ max: v })} min={1} />
          )}
        </>
      )}
    </div>
  );
}
