import { useEffect, useState } from "react";

export function SavingThrowRow({ label, value, onChange }: {
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
    <div className="flex flex-col items-center gap-0.5 border border-gold-500/20 rounded-lg px-1.5 py-1.5">
      <span className="text-gold-600 text-[9px] font-bold uppercase tracking-wide w-full text-center">
        {label.slice(0, 3).toUpperCase()}
      </span>
      <input
        type="number"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { commit(e.currentTarget.value); e.currentTarget.blur(); } }}
        className="text-sm font-semibold text-gold-300 text-center bg-base outline-none w-full rounded cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}
