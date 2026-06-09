import { Minus, Plus } from "lucide-react";

interface CounterInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function CounterInput({ value, onChange, min, max, className = "" }: CounterInputProps) {
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
      <input
        type="number"
        min={min}
        max={max}
        className="flex-1 w-9! min-w-0 h-full text-sm font-light text-gold-300 text-center bg-base outline-none rounded-none border-0"
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || (min ?? 0))}
      />
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
