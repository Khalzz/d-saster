import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, AlertCircle, Info } from "lucide-react";

const HANDLEBAR_VARS: { key: string; description: string }[] = [
  { key: "stat_points",       description: "Raw stat value (e.g. 15)" },
  { key: "stat_mod",          description: "Computed modifier — result of the modifier formula" },
  { key: "level",             description: "Character level" },
  { key: "proficiency_bonus", description: "Character proficiency bonus" },
  { key: "inspiration",       description: "Character inspiration value" },
];

export function HandlebarInput({
  value,
  onChange,
  placeholder,
  defaultFormula,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  defaultFormula?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdown, setDropdown] = useState<{ top: number; left: number; width: number; query: string } | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const getOpenToken = (val: string, cursor: number) => {
    const before = val.slice(0, cursor);
    const lastOpen = before.lastIndexOf("{{");
    const lastClose = before.lastIndexOf("}}");
    if (lastOpen !== -1 && lastOpen > lastClose) return { start: lastOpen, query: before.slice(lastOpen + 2) };
    return null;
  };

  const openDropdown = (val: string, cursor: number) => {
    const token = getOpenToken(val, cursor);
    if (!token) { setDropdown(null); return; }
    const r = inputRef.current?.getBoundingClientRect();
    if (!r) return;
    setDropdown({ top: r.bottom + 4, left: r.left, width: r.width, query: token.query });
    setActiveIdx(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    openDropdown(e.target.value, e.target.selectionStart ?? e.target.value.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdown) return;
    const filtered = HANDLEBAR_VARS.filter(v => v.key.startsWith(dropdown.query.toLowerCase()));
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && filtered[activeIdx]) { e.preventDefault(); commit(filtered[activeIdx].key); }
    else if (e.key === "Escape") { setDropdown(null); }
  };

  const commit = (key: string) => {
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const token = getOpenToken(value, cursor);
    if (!token) return;
    const newVal = value.slice(0, token.start) + `{{${key}}}` + value.slice(cursor);
    onChange(newVal);
    setDropdown(null);
    requestAnimationFrame(() => {
      const pos = token.start + key.length + 4;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    });
  };

  const filtered = dropdown ? HANDLEBAR_VARS.filter(v => v.key.startsWith(dropdown.query.toLowerCase())) : [];

  const validKeys = new Set(HANDLEBAR_VARS.map(v => v.key));
  const validate = (val: string): { valid: boolean; error?: string } => {
    if (!val.trim()) return { valid: true };
    const unclosed = val.match(/\{\{(?![^}]*\}\})/);
    if (unclosed) return { valid: false, error: "Unclosed {{" };
    const tokens = [...val.matchAll(/\{\{(\w*)\}\}/g)];
    for (const m of tokens) {
      if (!validKeys.has(m[1])) return { valid: false, error: `Unknown variable: {{${m[1]}}}` };
    }
    if (tokens.length === 0) return { valid: false, error: "No variables used" };
    return { valid: true };
  };
  const { valid, error } = validate(value);

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        className={`bg-base border rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 outline-none font-mono ${valid ? "border-gold-500/30 focus:border-gold-500!" : "border-red-500/50 focus:border-red-500!"}`}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setDropdown(null), 120)}
        placeholder={placeholder ?? "{{stat_mod}} + {{proficiency_bonus}}"}
      />
      {value.trim() ? (
        <div className={`flex items-center gap-1 mt-1 text-[10px] ${valid ? "text-green-400" : "text-red-400"}`}>
          {valid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          <span>{valid ? "Valid formula" : error}</span>
        </div>
      ) : defaultFormula ? (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-gold-700">
          <Info className="h-3 w-3" />
          <span>Defaults to <code className="font-mono text-gold-500">{defaultFormula}</code></span>
        </div>
      ) : null}
      {dropdown && filtered.length > 0 && createPortal(
        <div
          style={{ position: "fixed", top: dropdown.top, left: dropdown.left, width: dropdown.width, zIndex: 1000 }}
          className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl flex flex-col"
        >
          {filtered.map((v, i) => (
            <button
              key={v.key}
              className={`h-auto! min-w-0! px-3! py-2! flex items-center gap-2.5 border-0! rounded-none! w-full! justify-start! text-left! ${i === activeIdx ? "bg-gold-500/15!" : "bg-transparent! hover:bg-gold-500/8!"}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => { e.preventDefault(); commit(v.key); }}
            >
              <code className="text-gold-300 font-mono text-[10px] shrink-0">{`{{${v.key}}}`}</code>
              <span className="text-gold-700 text-[10px] leading-snug flex-1 truncate">{v.description}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
