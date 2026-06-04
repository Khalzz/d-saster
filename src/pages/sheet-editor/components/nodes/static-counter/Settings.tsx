import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import { HandlebarInput } from "../HandlebarInput";
import type { StaticCounterSettings } from "../../../types";
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

export function StaticCounterSettingsForm({ settings, onChange, availableVars }: NodeSettingsProps) {
  const s = settings as unknown as StaticCounterSettings;

  return (
    <div className="flex flex-col">
      <Section label="Content" />
      <Field label="Label">
        <HandlebarInput
          value={s.label ?? ""}
          onChange={(v) => onChange({ label: v })}
          placeholder="My Counter"
          extraVars={availableVars}
        />
      </Field>
      <div className="mt-2">
        <Field label="Value">
          <HandlebarInput
            value={s.value ?? ""}
            onChange={(v) => onChange({ value: v })}
            placeholder="{{level}}"
            extraVars={availableVars}
          />
        </Field>
      </div>

      <Section label="Display" />
      <div className="mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-600">Direction</span>
        <div className="flex gap-1 mt-1">
          {(["vertical", "horizontal"] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`flex-1 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md border transition-colors ${
                (s.direction ?? "vertical") === d
                  ? "border-gold-500 text-gold-400 bg-gold-500/10"
                  : "border-gold-500/20 text-gold-600 hover:border-gold-500/40"
              }`}
              onClick={() => onChange({ direction: d })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      {(s.direction ?? "vertical") === "vertical" && (
        <Toggle label="Shield view" checked={s.shieldView ?? false} onChange={(v) => onChange({ shieldView: v })} />
      )}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <NumberField label="Width" value={s.width ?? 0} onChange={(v) => onChange({ width: v })} suffix="%" max={100} />
        {(s.direction ?? "vertical") === "vertical" && (
          <NumberField label="Height" value={s.height ?? 0} onChange={(v) => onChange({ height: v })} suffix="px" />
        )}
      </div>
    </div>
  );
}
