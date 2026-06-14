import { Minus, Plus } from "lucide-react";

interface CounterInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
  inputClassName?: string;
  suffix?: string;
}

export function CounterInput({ value, onChange, min, max, className = "", inputClassName = "", suffix }: CounterInputProps) {
  const dec = () => onChange(min !== undefined ? Math.max(min, value - 1) : value - 1);
  const inc = () => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1);

  return (
    <div className={"flex flex-row items-center border border-gold-500/30 rounded-md h-8 overflow-hidden" + className}>
      <button
        type="button"
        className="border-0 rounded-none outline-none w-6"
        onClick={dec}
      >
        <Minus size={10} />
      </button>
      <div className="flex items-center justify-center flex-1 min-w-0 h-full w-fit px-2 bg-base gap-0.5">
        <input
          type="number"
          min={min}
          max={max}
          className={"px-0 min-w-0 h-full text-sm font-light text-gold-300 text-center bg-transparent outline-none rounded-none border-0" + inputClassName}
          style={{ width: `${Math.max(2, String(value).length)}ch` }}
          value={value}
          onChange={e => onChange(parseInt(e.target.value) || (min ?? 0))}
        />
        {suffix && (
          <span className="text-[9px] font-semibold uppercase tracking-widest text-gold-600 select-none shrink-0 self-end mb-0.5">{suffix}</span>
        )}
      </div>
      <button
        type="button"
        className="border-0 rounded-none w-6"
        onClick={inc}
      >
        <Plus size={10} />
      </button>
    </div>
  );
}
