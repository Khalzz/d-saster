import { ChevronDown, Plus } from "lucide-react";
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
  onAddNew?: (name: string) => void;
  addNewPlaceholder?: string;
}

export function Dropdown({ options, value, onChange, placeholder = "Select...", onAddNew, addNewPlaceholder = "New option…" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newInput, setNewInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) { setOpen(false); setAdding(false); setNewInput(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const confirmNew = () => {
    const name = newInput.trim();
    if (!name) return;
    onAddNew!(name);
    onChange(name);
    setNewInput("");
    setAdding(false);
    setOpen(false);
  };

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button className="w-full flex justify-between px-3" onClick={() => setOpen(v => !v)}>
        {selected?.label ?? placeholder}
        <ChevronDown className={`h-3 w-3 text-gold-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`px-3 py-2 cursor-pointer hover:bg-gold-500/10 text-xs ${value === opt.value ? "text-gold-400 bg-gold-500/10" : "text-gold-300"}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && !onAddNew && (
            <div className="px-3 py-2 text-gold-700 text-xs">No options available</div>
          )}
          {onAddNew && (
            <>
              {options.length > 0 && <div className="border-t border-gold-500/15" />}
              {adding ? (
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <input
                    autoFocus
                    className="flex-1 bg-transparent text-xs text-gold-300 outline-none placeholder:text-gold-700 caret-gold-500 border-0! p-0! h-auto! shadow-none!"
                    placeholder={addNewPlaceholder}
                    value={newInput}
                    onChange={e => setNewInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") confirmNew(); if (e.key === "Escape") { setAdding(false); setNewInput(""); } }}
                  />
                  <button type="button" className="text-[10px]! h-6! px-2! bg-gold-500/15! border-gold-500/30! text-gold-400!" onClick={confirmNew}>
                    Add
                  </button>
                </div>
              ) : (
                <div
                  className="px-3 py-2 cursor-pointer text-xs text-gold-600 hover:bg-gold-500/10 transition-colors flex items-center gap-1.5"
                  onClick={e => { e.stopPropagation(); setAdding(true); }}
                >
                  <Plus className="h-3 w-3" /> New category…
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
