import { useEffect, useState } from "react";
import { Character } from "../../../../../pages/character/character-editor";
import { StatDefinition } from "../../../../../pages/ruleset/ruleset-editor";
import { calcModifier } from "../../../../../pages/character/components/StatCell";
import Tooltip from "../../../tooltip/Tooltip";

export function AutoStatCell({ def, char, onChange, formula }: { def: StatDefinition; char: Character; onChange: (p: Partial<Character>) => void; formula?: string }) {
  const val = char.stats[def.key] ?? 10;
  const [inputVal, setInputVal] = useState(String(val));
  useEffect(() => { setInputVal(String(val)); }, [val]);

  const handleChange = (raw: string) => {
    const v = Math.max(1, Math.min(30, parseInt(raw) || 1));
    onChange({ stats: { ...char.stats, [def.key]: v } });
  };

  const content = (
    <div className="flex flex-col items-center gap-0.5 border border-gold-500/20 rounded-lg pt-2 pb-1.5 px-1 select-none">
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
        onBlur={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { handleChange(e.currentTarget.value); e.currentTarget.blur(); } }}
        className="w-full text-center outline-none text-gold-600 text-xs font-medium rounded-md px-0.5 py-0 h-6 transition-colors bg-base hover:bg-gold-500/10 cursor-text "
      />
    </div>
  );

  if (def.description) {
    return <Tooltip text={def.description} title={def.label}>{content}</Tooltip>;
  }
  return content;
}