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
    <div className={`flex overflow-hidden border border-gold-500/20 rounded-lg ${className}`}>
      <button
        type="button"
        className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
        onClick={dec}
      >
        <Minus className="h-3 w-3" />
      </button>
      <div className="w-px bg-gold-500/20 shrink-0" />
      <input
        type="number"
        min={min}
        max={max}
        className="flex-1 w-10 min-w-0 h-full text-sm font-light text-gold-300 text-center bg-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || (min ?? 0))}
      />
      <div className="w-px bg-gold-500/20 shrink-0" />
      <button
        type="button"
        className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
        onClick={inc}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
