import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, AlertCircle, Info, ChevronRight } from "lucide-react";
import type { VarDef } from "../../types";

const STATIC_VARS: VarDef[] = [
  { key: "stat_points", description: "Raw stat value (e.g. 15)" },
  { key: "stat_mod",    description: "Computed modifier — result of the modifier formula" },
];

function buildVarList(extraVars?: VarDef[]) {
  const all = [...STATIC_VARS];
  for (const v of extraVars ?? []) {
    if (!all.some(s => s.key === v.key)) all.push(v);
  }
  return all;
}

function getOpenToken(val: string, cursor: number) {
  const before = val.slice(0, cursor);
  const lastOpen = before.lastIndexOf("{{");
  const lastClose = before.lastIndexOf("}}");
  if (lastOpen !== -1 && lastOpen > lastClose) return { start: lastOpen, query: before.slice(lastOpen + 2) };
  return null;
}

// ── Grouped dropdown items ─────────────────────────────────────────────────
type DropdownItem =
  | { type: "group"; prefix: string }
  | { type: "var"; v: VarDef };

function buildDropdownItems(allVars: VarDef[], query: string): DropdownItem[] {
  const matched = allVars.filter(v => v.key.startsWith(query));
  const seenGroups = new Set<string>();
  const groups: DropdownItem[] = [];
  const leaves: DropdownItem[] = [];

  for (const v of matched) {
    const afterQuery = v.key.slice(query.length);
    const stripped = afterQuery.startsWith(".") ? afterQuery.slice(1) : afterQuery;
    const nextDot = stripped.indexOf(".");

    if (nextDot !== -1) {
      const prefix = (afterQuery.startsWith(".") ? query + "." : query) + stripped.slice(0, nextDot);
      if (!seenGroups.has(prefix)) {
        seenGroups.add(prefix);
        groups.push({ type: "group", prefix });
      }
    } else {
      leaves.push({ type: "var", v });
    }
  }

  return [...groups, ...leaves];
}

// ── Shared dropdown portal ─────────────────────────────────────────────────
function DropdownPortal({
  dropdown, items, activeIdx, setActiveIdx, onCommit,
}: {
  dropdown: { top: number; left: number; width: number };
  items: DropdownItem[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onCommit: (key: string, isGroup: boolean) => void;
}) {
  if (items.length === 0) return null;
  return createPortal(
    <div
      style={{ position: "fixed", top: dropdown.top, left: dropdown.left, width: dropdown.width, zIndex: 1000 }}
      className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl flex flex-col"
      onMouseLeave={() => setActiveIdx(-1)}
    >
      {items.map((item, i) =>
        item.type === "group" ? (
          <button
            key={item.prefix}
            className={`h-auto! min-w-0! px-3! py-2! flex items-center gap-2.5 border-0! rounded-none! w-full! justify-start! text-left! transition-colors ${i === activeIdx ? "bg-gold-500/15!" : "bg-transparent!"}`}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseDown={(e) => { e.preventDefault(); onCommit(item.prefix, true); }}
          >
            <code className="text-gold-400 font-mono text-[10px] shrink-0">{item.prefix}</code>
            <ChevronRight className="h-3 w-3 text-gold-600 ml-auto shrink-0" />
          </button>
        ) : (
          <button
            key={item.v.key}
            className={`h-auto! min-w-0! px-3! py-2! flex items-center gap-2.5 border-0! rounded-none! w-full! justify-start! text-left! transition-colors ${i === activeIdx ? "bg-gold-500/15!" : "bg-transparent!"}`}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseDown={(e) => { e.preventDefault(); onCommit(item.v.key, false); }}
          >
            <code className="text-gold-300 font-mono text-[10px] shrink-0">{`{{${item.v.key}}}`}</code>
            <span className="text-gold-700 text-[10px] leading-snug flex-1 truncate">{item.v.description}</span>
          </button>
        )
      )}
    </div>,
    document.body,
  );
}

// ── Single-line formula input ──────────────────────────────────────────────
export function HandlebarInput({
  value: valueProp, onChange, placeholder, defaultFormula, extraVars,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  defaultFormula?: string;
  extraVars?: VarDef[];
}) {
  const value = String(valueProp ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdown, setDropdown] = useState<{ top: number; left: number; width: number; query: string } | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const allVars = buildVarList(extraVars);

  const openDropdown = (val: string, cursor: number) => {
    const token = getOpenToken(val, cursor);
    if (!token) { setDropdown(null); return; }
    const r = inputRef.current?.getBoundingClientRect();
    if (!r) return;
    setDropdown({ top: r.bottom + 4, left: r.left, width: r.width, query: token.query });
    setActiveIdx(-1);
  };

  const commit = (key: string, isGroup: boolean) => {
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const token = getOpenToken(value, cursor);
    if (!token) return;
    if (isGroup) {
      const newVal = value.slice(0, token.start) + `{{${key}.` + value.slice(cursor);
      onChange(newVal);
      requestAnimationFrame(() => {
        const pos = token.start + key.length + 3;
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(pos, pos);
        openDropdown(newVal, pos);
      });
    } else {
      const newVal = value.slice(0, token.start) + `{{${key}}}` + value.slice(cursor);
      onChange(newVal);
      setDropdown(null);
      requestAnimationFrame(() => {
        const pos = token.start + key.length + 4;
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(pos, pos);
      });
    }
  };

  const items = dropdown ? buildDropdownItems(allVars, dropdown.query) : [];

  const validKeys = new Set(allVars.map(v => v.key));
  const validate = (val: string): { valid: boolean; error?: string } => {
    if (!val.trim()) return { valid: true };
    const unclosed = val.match(/\{\{(?![^}]*\}\})/);
    if (unclosed) return { valid: false, error: "Unclosed {{" };
    const tokens = [...val.matchAll(/\{\{([\w.]*)\}\}/g)];
    for (const m of tokens) {
      if (!validKeys.has(m[1])) return { valid: false, error: `Unknown variable: {{${m[1]}}}` };
    }
    return { valid: true };
  };
  const { valid, error } = validate(value);

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        className={`bg-base border rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 outline-none font-mono ${valid ? "border-gold-500/30 focus:border-gold-500!" : "border-red-500/50 focus:border-red-500!"}`}
        onChange={(e) => { onChange(e.target.value); openDropdown(e.target.value, e.target.selectionStart ?? e.target.value.length); }}
        onKeyDown={(e) => {
          if (!dropdown) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
          else if (e.key === "Enter" && items[activeIdx]) {
            e.preventDefault();
            const item = items[activeIdx];
            if (item.type === "group") commit(item.prefix, true);
            else commit(item.v.key, false);
          }
          else if (e.key === "Escape") { setDropdown(null); }
        }}
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
      {dropdown && <DropdownPortal dropdown={dropdown} items={items} activeIdx={activeIdx} setActiveIdx={setActiveIdx} onCommit={commit} />}
    </>
  );
}

// ── Multi-line handlebar-aware textarea ────────────────────────────────────
export function HandlebarTextarea({
  value, onChange, placeholder, rows = 3, extraVars,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  extraVars?: VarDef[];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dropdown, setDropdown] = useState<{ top: number; left: number; width: number; query: string } | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const allVars = buildVarList(extraVars);

  const openDropdown = (val: string, cursor: number) => {
    const token = getOpenToken(val, cursor);
    if (!token) { setDropdown(null); return; }
    const r = textareaRef.current?.getBoundingClientRect();
    if (!r) return;
    setDropdown({ top: r.bottom + 4, left: r.left, width: r.width, query: token.query });
    setActiveIdx(-1);
  };

  const commit = (key: string, isGroup: boolean) => {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const token = getOpenToken(value, cursor);
    if (!token) return;
    if (isGroup) {
      const newVal = value.slice(0, token.start) + `{{${key}.` + value.slice(cursor);
      onChange(newVal);
      requestAnimationFrame(() => {
        const pos = token.start + key.length + 3;
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(pos, pos);
        openDropdown(newVal, pos);
      });
    } else {
      const newVal = value.slice(0, token.start) + `{{${key}}}` + value.slice(cursor);
      onChange(newVal);
      setDropdown(null);
      requestAnimationFrame(() => {
        const pos = token.start + key.length + 4;
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(pos, pos);
      });
    }
  };

  const items = dropdown ? buildDropdownItems(allVars, dropdown.query) : [];

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        rows={rows}
        placeholder={placeholder ?? "Tooltip text shown on hover…"}
        className="w-full rounded-md px-2.5 py-2 border border-gold-500/20 bg-base text-gold-200 text-xs resize-y outline-none focus:border-gold-500/40 transition-colors placeholder:text-gold-700 font-sans"
        onChange={(e) => { onChange(e.target.value); openDropdown(e.target.value, e.target.selectionStart ?? e.target.value.length); }}
        onKeyDown={(e) => {
          if (!dropdown) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
          else if (e.key === "Enter" && items[activeIdx]) {
            e.preventDefault();
            const item = items[activeIdx];
            if (item.type === "group") commit(item.prefix, true);
            else commit(item.v.key, false);
          }
          else if (e.key === "Escape") { setDropdown(null); }
        }}
        onBlur={() => setTimeout(() => setDropdown(null), 120)}
      />
      {dropdown && <DropdownPortal dropdown={dropdown} items={items} activeIdx={activeIdx} setActiveIdx={setActiveIdx} onCommit={commit} />}
    </>
  );
}
