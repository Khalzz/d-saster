import { CircleHelp } from "lucide-react";
import { NumberField } from "../shared";
import { HandlebarInput } from "../HandlebarInput";
import Tooltip from "../../../../../components/ui/tooltip/Tooltip";
import Field from "../../../../../components/ui/Field";
import type { AutoSavingThrowsSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

const FORMULA_TOOLTIP = `Math expression for each saving throw value. Type \`{{\` to autocomplete.

**Available variables:**
- \`{{stat_points}}\` — Raw stat value
- \`{{stat_mod}}\` — Computed stat modifier
- \`{{level}}\` — Character level
- \`{{proficiency_bonus}}\` — Proficiency bonus
- \`{{inspiration}}\` — Inspiration value`;

export function AutoSavingThrowsSettingsForm({ settings, onChange, availableVars }: NodeSettingsProps) {
  const s = settings as unknown as AutoSavingThrowsSettings;

  return (
    <>
      <div className="mb-3">
        <Field label={
          <span className="flex items-center gap-1">
            Formula
            <Tooltip text={FORMULA_TOOLTIP}>
              <CircleHelp className="h-3 w-3 text-gold-700 hover:text-gold-500 cursor-help" />
            </Tooltip>
          </span>
        }>
          <HandlebarInput
            value={s.formula}
            onChange={(v) => onChange({ formula: v })}
            placeholder="{{stat_mod}} + {{proficiency_bonus}}"
            defaultFormula="{{stat_mod}} + {{proficiency_bonus}}"
            extraVars={availableVars}
          />
        </Field>
      </div>
      <NumberField
        label="Columns"
        value={s.columns}
        onChange={(v) => onChange({ columns: v })}
        min={1}
        max={6}
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
    </>
  );
}
