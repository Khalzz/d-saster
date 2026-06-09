import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Dropdown({ options, value, onChange, placeholder = "Select..." }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button className="w-full flex justify-between px-3" onClick={() => setOpen(v => !v)}
      >
        {selected?.label ?? placeholder}
        <ChevronDown className={`h-3 w-3 text-gold-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-gold-700 text-xs">No options available</div>
          ) : options.map(opt => (
            <div
              key={opt.value}
              className={`px-3 py-2 cursor-pointer hover:bg-gold-500/10 text-xs ${value === opt.value ? "text-gold-400 bg-gold-500/10" : "text-gold-300"}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
