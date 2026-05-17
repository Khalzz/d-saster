import { useEffect, useState } from "react";
import Card from "../../../components/ui/card/card";

export function ValueCell({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [inputVal, setInputVal] = useState(String(value));
  useEffect(() => { setInputVal(String(value)); }, [value]);

  const commit = (raw: string) => {
    const n = parseInt(raw);
    onChange(isNaN(n) ? 0 : n);
  };

  return (
    <Card className="flex flex-row gap-2 items-center p-1!">
      <input
        type="number"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { commit(e.currentTarget.value); e.currentTarget.blur(); } }}
        className="text-sm font-light text-gold-300 text-center bg-base border border-gold-500/20 outline-none w-10 h-10 rounded-lg shrink-0 transition-colors hover:border-gold-500/50 cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-gold-400 text-sm">{label}</span>
    </Card>
  );
}
