import { CircleHelp } from "lucide-react";
import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import { HandlebarInput } from "../HandlebarInput";
import Tooltip from "../../../../../components/ui/tooltip/Tooltip";
import { evalFormula } from "../../../../../pages/sheet-editor/handlebars";
import type { StaticCounterSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

const MOCK_VARS: Record<string, string | number> = {
  level: 5,
  proficiency_bonus: 3,
  "stat.str.points": 15, "stat.str.mod": "+2",
  "stat.dex.points": 14, "stat.dex.mod": "+2",
  "stat.con.points": 13, "stat.con.mod": "+1",
  "stat.int.points": 12, "stat.int.mod": "+1",
  "stat.wis.points": 10, "stat.wis.mod": "",
  "stat.cha.points": 8,  "stat.cha.mod": "-1",
};

const VALUE_TOOLTIP = `Math expression or handlebar variable. Type \`{{\` to autocomplete.

Supports full JS math — e.g:
- \`{{level}}\`
- \`{{stat.str.mod}}\`
- \`Math.floor(({{level}} - 1) / 4) + 2\``;


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

  const preview = (() => {
    const val = s.value?.trim();
    if (!val) return null;
    try {
      const result = evalFormula(val, MOCK_VARS);
      // Only show if the result differs from the raw input (i.e. something was actually evaluated)
      return result !== val ? result : null;
    } catch { return null; }
  })();

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
        <Field label={
          <span className="flex items-center gap-1">
            Value
            <Tooltip text={VALUE_TOOLTIP}>
              <CircleHelp className="h-3 w-3 text-gold-700 hover:text-gold-500 cursor-help" />
            </Tooltip>
          </span>
        }>
          <HandlebarInput
            value={s.value ?? ""}
            onChange={(v) => onChange({ value: v })}
            placeholder="{{level}}"
            defaultFormula="Math.floor(({{level}} - 1) / 4) + 2"
            extraVars={availableVars}
          />
          {preview !== null && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-gold-600">≈</span>
              <code className="text-[10px] font-mono text-gold-300 bg-gold-500/10 px-1.5 py-0.5 rounded">{preview}</code>
              <span className="text-[10px] text-gold-700">with mock values</span>
            </div>
          )}
        </Field>
      </div>

      <Section label="Display" />
      <div className="mb-1">
        <Field label="Direction">
          <div className="flex rounded-md overflow-hidden border border-gold-500/30">
            {(["Vertical", "Horizontal"] as const).map((opt) => {
              const val = opt.toLowerCase() as "vertical" | "horizontal";
              const active = (s.direction ?? "vertical") === val;
              return (
                <button
                  key={opt}
                  onClick={() => onChange({ direction: val })}
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
      {(s.direction ?? "vertical") === "vertical" && (
        <Toggle label="Shield view" checked={s.shieldView ?? false} onChange={(v) => onChange({ shieldView: v })} />
      )}
      <Toggle label="Show sign" checked={s.showSign ?? false} onChange={(v) => onChange({ showSign: v })} />
      <div className="grid grid-cols-2 gap-2 mt-1">
        <NumberField label="Width" value={s.width ?? 0} onChange={(v) => onChange({ width: v })} suffix="%" max={100} />
        {(s.direction ?? "vertical") === "vertical" && (
          <NumberField label="Height" value={s.height ?? 0} onChange={(v) => onChange({ height: v })} suffix="px" />
        )}
      </div>
    </div>
  );
}
