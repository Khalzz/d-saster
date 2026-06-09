import { labelToVar, evalFormula } from "../../../../../pages/sheet-editor/handlebars";
import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { CounterSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import { StaticCounterBox } from "./static-counter-box";
import Field from "../../../Field";
import { CounterInput } from "./counter-input";


export function CountNode({ node, useSheet }: { node: LayoutNode; useSheet: () => SheetContext }) {
  const { label, max, hasMax, allowNegative, isStatic, staticValue, padding } = node.settings as CounterSettings;
  const { char, onChange, vars } = useSheet();

  const key = labelToVar(label);
  const value = typeof char.customFields?.[key] === "number"
    ? char.customFields[key] as number
    : 0;

  const clamp = (v: number) => {
    if (!allowNegative && v < 0) v = 0;
    if (hasMax && v > max) v = max;
    return v;
  };

  const set = (v: number) => {
    onChange({ customFields: { ...char.customFields, [key]: clamp(v) } });
  };

  if (isStatic) {
    const { shieldView = false, width = 0, height = 0 } = node.settings as CounterSettings;
    const resolved = evalFormula(staticValue || "0", vars);
    return (
      <StaticCounterBox label={label} shieldView={shieldView} width={width} height={height} padding={padding}>
        <span className="text-xl font-light leading-tight text-gold-300 text-center mb-2">{resolved}</span>
      </StaticCounterBox>
    );
  }

  return (
    <Field label={
      <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
        {label || "Counter"}
        {hasMax && (
          <span className="text-gold-700 text-[9px] font-normal normal-case tracking-normal"> ({max} max)</span>
        )}
      </label>
    }>
      <CounterInput value={value} onChange={set} min={allowNegative ? undefined : 0} max={hasMax ? max : undefined} />  
    </Field>
  );
}