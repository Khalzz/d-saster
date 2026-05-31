import { useEffect, useState } from "react";
import Tooltip from "../../../components/ui/tooltip/Tooltip";
import type { StatDefinition } from "../../ruleset/ruleset-editor";

export function calcModifier(val: number, formula?: string): string {
  if (formula?.includes("{{stat_points}}")) {
    try {
      const expr = formula.replace(/\{\{stat_points\}\}/g, String(val));
      // eslint-disable-next-line no-new-func
      const result = Math.floor(new Function(`return (${expr})`)() as number);
      return result >= 0 ? `+${result}` : `${result}`;
    } catch {
      return "?";
    }
  }
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function StatCell({ def, val, formula, onChange }: {
  def: StatDefinition;
  val: number;
  formula?: string;
  onChange: (raw: string) => void;
}) {
  const [inputVal, setInputVal] = useState(String(val));

  useEffect(() => { setInputVal(String(val)); }, [val]);

  const content = (
    <div
      className="flex flex-col items-center gap-0.5 border border-gold-500/20 rounded-lg pt-2 pb-1.5 px-1 cursor-pointer select-none"
    >
      <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider truncate w-full text-center">
        {def.label.slice(0, 3).toUpperCase()}
      </span>
      <span className="text-xl font-light leading-tight text-gold-300">
        {calcModifier(val, formula)}
      </span>
      <input
        type="number"
        min={1}
        max={30}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(e.currentTarget.value); e.currentTarget.blur(); } }}
        className="w-full text-center outline-none text-gold-600 text-[11px] font-medium rounded-md px-0.5 transition-colors bg-base hover:bg-gold-500/10 cursor-text select-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );

  if (def.description) {
    return (
      <Tooltip text={def.description} title={def.label}>
        {content}
      </Tooltip>
    );
  }

  return content;
}
