import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Minus, Plus, Star, ChevronDown, UserRound, ImagePlus, X, CircleHelp } from "lucide-react";
import Tooltip from "../../../components/ui/tooltip/Tooltip";
import type { LayoutNode, SectionSettings, ContainerSettings, ImageSettings, TextInputSettings, LevelCountSettings, CounterSettings, StaticCounterSettings, ClassSelectorSettings, GridSettings, AutoStatsSettings, AutoSkillsSettings, AutoSavingThrowsSettings, ProficiencyBonusSettings } from "../../sheet-editor/types";
import type { Ruleset, StatDefinition, RulesetSkill } from "../../ruleset/ruleset-editor";
import type { Character, CharacterClass } from "../character-editor";
import { calcModifier } from "./StatCell";
import { labelToVar, resolveHandlebars } from "../../sheet-editor/handlebars";
import { StaticCounterBox } from "../../sheet-editor/components/nodes/counter/StaticCounterBox";
import { useRef } from "react";

// ── Context for character data ─────────────────────────────────────────────
interface CharacterSheetContext {
  char: Character;
  onChange: (patch: Partial<Character>) => void;
  ruleset?: Ruleset;
  statDefs: StatDefinition[];
  skills: RulesetSkill[];
  classes: CharacterClass[];
  onClassCreated?: (cls: CharacterClass) => void;
  vars: Record<string, string | number>;
}

const SheetCtx = createContext<CharacterSheetContext>(null!);
function useSheet() { return useContext(SheetCtx); }

// Also provide tree context for saving throws
const TreeCtx = createContext<LayoutNode[]>([]);
function useTree() { return useContext(TreeCtx); }

// ── Main component ─────────────────────────────────────────────────────────
interface CharacterSheetViewProps {
  char: Character;
  onChange: (patch: Partial<Character>) => void;
  ruleset?: Ruleset;
  statDefs: StatDefinition[];
  skills: RulesetSkill[];
  classes: CharacterClass[];
  onClassCreated?: (cls: CharacterClass) => void;
}

export function CharacterSheetView({ char, onChange, ruleset, statDefs, skills, classes, onClassCreated }: CharacterSheetViewProps) {
  const [nodes, setNodes] = useState<LayoutNode[]>([]);

  useEffect(() => {
    invoke<{ nodes: LayoutNode[] } | null>("load_sheet", { id: "default" })
      .then((data) => { if (data?.nodes) setNodes(data.nodes); })
      .catch(() => {});
  }, []);

  const vars: Record<string, string | number> = {
    level: char.level,
    proficiency_bonus: char.proficiencyBonus,
    inspiration: char.inspiration,
    armor_class: char.armorClass,
    speed: char.speed,
    initiative: char.initiative,
    name: char.name,
    race: char.race,
    origin: char.origin,
    description: char.description,
    ...Object.fromEntries(
      Object.entries(char.stats ?? {}).flatMap(([k, v]) => [
        [`stat.${k}.points`, v],
        [`stat.${k}.mod`, parseInt(calcModifier(v, ruleset?.modifierFormula)) || 0],
      ])
    ),
    ...char.customFields,
  };

  const ctx: CharacterSheetContext = { char, onChange, ruleset, statDefs, skills, classes, onClassCreated, vars };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gold-700 text-xs">
        No sheet layout configured
      </div>
    );
  }

  return (
    <SheetCtx.Provider value={ctx}>
      <TreeCtx.Provider value={nodes}>
        <div className="flex flex-col gap-4 p-6">
          {nodes.map((node) => (
            <InteractiveNode key={node.id} node={node} />
          ))}
        </div>
      </TreeCtx.Provider>
    </SheetCtx.Provider>
  );
}

// ── Recursive renderer ─────────────────────────────────────────────────────
function InteractiveNode({ node }: { node: LayoutNode }) {
  switch (node.type) {
    case "section": return <SectionNode node={node} />;
    case "container": return <ContainerNode node={node} />;
    case "image": return <ImageNode node={node} />;
    case "text-input": return <TextInputNode node={node} />;
    case "level-count": return <LevelCountNode node={node} />;
    case "counter": return <CounterNode node={node} />;
    case "static-counter": return <StaticCounterNode node={node} />;
    case "class-selector": return <ClassSelectorNode node={node} />;
    case "grid": return <GridNode node={node} />;
    case "auto-stats": return <AutoStatsNode node={node} />;
    case "auto-skills": return <AutoSkillsNode node={node} />;
    case "auto-saving-throws": return <AutoSavingThrowsNode node={node} />;
    case "proficiency-bonus": return <ProficiencyBonusNode node={node} />;
    default: return null;
  }
}

// ── Section ────────────────────────────────────────────────────────────────
function SectionNode({ node }: { node: LayoutNode }) {
  const { title, padding, gap, width, description, direction = "column" } = node.settings as SectionSettings;
  const { vars } = useSheet();
  const resolvedDescription = description ? resolveHandlebars(description, vars) : "";
  return (
    <div
      className="relative rounded-md border border-gold-500/30"
      style={{ padding, height: "fit-content", ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}
    >
      <span className="absolute top-0 left-3 h-2 flex items-center -translate-y-1/2 px-1.5 bg-surface text-[10px] font-semibold uppercase tracking-widest text-gold-500/50 select-none gap-1">
        {title || "Section"}
        {resolvedDescription && (
          <Tooltip text={resolvedDescription}>
            <CircleHelp className="h-3 w-3 text-gold-600 hover:text-gold-400 transition-colors" />
          </Tooltip>
        )}
      </span>
      <div className={`flex ${direction === "row" ? "flex-row flex-wrap" : "flex-col"}`} style={{ gap }}>
        {node.children.map((child) => (
          <InteractiveNode key={child.id} node={child} />
        ))}
      </div>
    </div>
  );
}

// ── Container ──────────────────────────────────────────────────────────────
function ContainerNode({ node }: { node: LayoutNode }) {
  const s = node.settings as ContainerSettings;
  const { padding, gap, direction } = s;
  const flexStyle: React.CSSProperties =
    s.width > 0
      ? { flex: `0 0 ${s.width}%`, maxWidth: `${s.width}%` }
      : { flex: "1 1 0%", minWidth: 0 };

  return (
    <div
      style={{
        ...flexStyle,
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        padding,
        gap,
      }}
    >
      {node.children.map((child) => (
        <InteractiveNode key={child.id} node={child} />
      ))}
    </div>
  );
}

// ── Image (portrait) ───────────────────────────────────────────────────────
function ImageNode({ node }: { node: LayoutNode }) {
  const { width, height, squared, padding } = node.settings as ImageSettings;
  const { char, onChange } = useSheet();
  const imgInputRef = useRef<HTMLInputElement>(null);

  const containerStyle: React.CSSProperties = {
    padding,
    ...(width > 0 ? { width: `${width}%` } : {}),
    ...(height > 0 ? { height: `${height}%` } : {}),
    ...(squared && { aspectRatio: "1 / 1" }),
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ image: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div
      className="rounded-lg border border-gold-500/30 hover:border-gold-500/70 transition-colors cursor-pointer overflow-hidden relative group"
      style={containerStyle}
      onClick={() => imgInputRef.current?.click()}
    >
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
      {char.image ? (
        <>
          <img src={char.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            <ImagePlus className="h-5 w-5 text-gold-400" />
            <span className="text-gold-400 text-xs">Replace</span>
          </div>
          <button
            className="absolute top-1.5 right-1.5 w-6! h-6! min-w-0! p-0! opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onChange({ image: undefined }); }}
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface text-gold-700 group-hover:text-gold-500 transition-colors">
          <UserRound className="h-10 w-10" />
          <span className="text-xs select-none">Add portrait</span>
        </div>
      )}
    </div>
  );
}

// ── Text Input ─────────────────────────────────────────────────────────────
function TextInputNode({ node }: { node: LayoutNode }) {
  const { label, placeholder, padding } = node.settings as TextInputSettings;
  const { char, onChange } = useSheet();

  const fixedKey = mapLabelToField(label);
  const customKey = labelToVar(label);

  const value = fixedKey
    ? (char as unknown as Record<string, unknown>)[fixedKey] as string ?? ""
    : char.customFields?.[customKey] as string ?? "";

  const handleChange = (v: string) => {
    if (fixedKey) {
      onChange({ [fixedKey]: v });
    } else if (customKey) {
      onChange({ customFields: { ...char.customFields, [customKey]: v } });
    }
  };

  return (
    <div className="w-full" style={{ padding }}>
      <div className="flex flex-col">
        <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          {label || "Label"}
        </label>
        <input
          className="field-input h-10 py-1"
          placeholder={placeholder || "Text input"}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function mapLabelToField(label: string): string | undefined {
  const l = label.toLowerCase().trim();
  if (l === "name" || l === "character name") return "name";
  if (l === "description" || l === "bio") return "description";
  if (l === "origin" || l === "background") return "origin";
  if (l === "race" || l === "species") return "race";
  return undefined;
}

// ── Level Count ────────────────────────────────────────────────────────────
function LevelCountNode({ node }: { node: LayoutNode }) {
  const { label, min, max, padding } = node.settings as LevelCountSettings;
  const { char, onChange } = useSheet();

  const handleDecrement = () => {
    const next = Math.max(min, char.level - 1);
    onChange({ level: next, proficiencyBonus: Math.floor((next - 1) / 4) + 2 });
  };
  const handleIncrement = () => {
    const next = Math.min(max, char.level + 1);
    onChange({ level: next, proficiencyBonus: Math.floor((next - 1) / 4) + 2 });
  };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(min, Math.min(max, parseInt(e.target.value) || min));
    onChange({ level: v, proficiencyBonus: Math.floor((v - 1) / 4) + 2 });
  };

  return (
    <div className="w-fit" style={{ padding }}>
      <div className="flex flex-col shrink-0">
        <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          {label || "Level"}{" "}
          <span className="text-gold-700 text-[9px] font-normal normal-case tracking-normal">({max} max)</span>
        </label>
        <div className="flex w-fit rounded-lg overflow-hidden border border-gold-500/20 h-10">
          <button
            type="button"
            className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
            onClick={handleDecrement}
          >
            <Minus className="h-3 w-3" />
          </button>
          <div className="w-px bg-gold-500/20 shrink-0" />
          <input
            type="number"
            className="w-10 h-full text-sm font-light text-gold-300 text-center bg-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={char.level}
            onChange={handleInput}
          />
          <div className="w-px bg-gold-500/20 shrink-0" />
          <button
            type="button"
            className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
            onClick={handleIncrement}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Counter ────────────────────────────────────────────────────────────────
function CounterNode({ node }: { node: LayoutNode }) {
  const { label, max, hasMax, allowNegative, isStatic, staticValue, padding } = node.settings as CounterSettings;
  const { char, onChange, vars } = useSheet();

  const key = labelToVar(label);
  const value = typeof char.customFields?.[key] === "number"
    ? char.customFields[key] as number
    : 0;

  const clamp = (v: number) => {
    if (!allowNegative && v < 0) v = 0;
    if (hasMax && v > max) v = max;
    return v;
  };

  const set = (v: number) => {
    onChange({ customFields: { ...char.customFields, [key]: clamp(v) } });
  };

  if (isStatic) {
    const { shieldView = false, width = 0, height = 0 } = node.settings as CounterSettings;
    const resolved = (() => {
      const r = resolveHandlebars(staticValue || "0", vars);
      try { return String(Function(`"use strict"; return (${r})`)()) } catch { return r; }
    })();
    return (
      <StaticCounterBox label={label} shieldView={shieldView} width={width} height={height} padding={padding}>
        <span className="text-xl font-light leading-tight text-gold-300 text-center mb-2">{resolved}</span>
      </StaticCounterBox>
    );
  }

  return (
    <div className="w-fit" style={{ padding }}>
      <div className="flex flex-col shrink-0">
        <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          {label || "Counter"}
          {hasMax && (
            <span className="text-gold-700 text-[9px] font-normal normal-case tracking-normal"> ({max} max)</span>
          )}
        </label>
        <div className="flex w-fit rounded-lg overflow-hidden border border-gold-500/20 h-10">
          <button
            type="button"
            className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
            onClick={() => set(value - 1)}
          >
            <Minus className="h-3 w-3" />
          </button>
          <div className="w-px bg-gold-500/20 shrink-0" />
          <input
            type="number"
            className="w-10 h-full text-sm font-light text-gold-300 text-center bg-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={value}
            onChange={(e) => set(parseInt(e.target.value) || 0)}
          />
          <div className="w-px bg-gold-500/20 shrink-0" />
          <button
            type="button"
            className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
            onClick={() => set(value + 1)}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Static Counter ─────────────────────────────────────────────────────────
function StaticCounterNode({ node }: { node: LayoutNode }) {
  const { label, value, direction = "vertical", shieldView = false, width = 0, height = 0, padding = 0 } = node.settings as StaticCounterSettings;
  const { vars } = useSheet();

  const resolve = (formula: string) => {
    const r = resolveHandlebars(formula || "0", vars);
    try { return String(Function(`"use strict"; return (${r})`)()) } catch { return r; }
  };

  const valueClass = direction === "horizontal"
    ? "text-sm font-bold text-gold-300"
    : "text-xl font-light leading-tight text-gold-300 text-center mb-2";

  return (
    <StaticCounterBox label={resolve(label)} direction={direction} shieldView={shieldView} width={width} height={height} padding={padding}>
      <span className={valueClass}>{resolve(value)}</span>
    </StaticCounterBox>
  );
}

// ── Class Selector ─────────────────────────────────────────────────────────
function ClassSelectorNode({ node }: { node: LayoutNode }) {
  const { label, padding, allowMulticlass } = node.settings as ClassSelectorSettings;
  const { char, onChange, classes } = useSheet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const selectedClass = classes.find(c => c.id === char.classId);
  const multiclassEntries = char.multiclass ?? [];

  const toggleMulticlass = (classId: string) => {
    const existing = multiclassEntries.find(m => m.classId === classId);
    if (existing) {
      onChange({ multiclass: multiclassEntries.filter(m => m.classId !== classId) });
    } else {
      onChange({ multiclass: [...multiclassEntries, { classId, level: 1 }] });
    }
  };

  // Single-class mode
  if (!allowMulticlass) {
    return (
      <div className="w-full" style={{ padding }} ref={ref}>
        <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          {label || "Class"}
        </span>
        <div className="relative">
          <div
            className="flex items-center gap-2 rounded-md px-2.5 py-2 border border-gold-500/20 bg-base cursor-pointer hover:border-gold-500/40 transition-colors"
            onClick={() => setOpen(v => !v)}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${selectedClass ? "text-gold-300" : "text-gold-600"}`}>
                {selectedClass?.name ?? "No class selected"}
              </p>
            </div>
            <ChevronDown className={`h-3 w-3 text-gold-500 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl">
              <div
                className={`px-3 py-2 cursor-pointer hover:bg-gold-500/10 text-xs ${!char.classId ? "text-gold-400 bg-gold-500/10" : "text-gold-600"}`}
                onClick={() => { onChange({ classId: undefined }); setOpen(false); }}
              >
                None
              </div>
              {classes.map(cls => (
                <div
                  key={cls.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gold-500/10 text-xs ${char.classId === cls.id ? "text-gold-400 bg-gold-500/10" : "text-gold-300"}`}
                  onClick={() => { onChange({ classId: cls.id }); setOpen(false); }}
                >
                  {cls.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Multiclass mode
  return (
    <div className="w-full" style={{ padding }} ref={ref}>
      <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
        {label || "Class"}
      </span>
      <div className="relative">
        <div
          className="flex items-center gap-2 rounded-md px-2.5 py-2 border border-gold-500/20 bg-base cursor-pointer hover:border-gold-500/40 transition-colors"
          onClick={() => setOpen(v => !v)}
        >
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium truncate ${selectedClass ? "text-gold-300" : "text-gold-600"}`}>
              {selectedClass?.name ?? "No class selected"}
            </p>
          </div>
          <ChevronDown className={`h-3 w-3 text-gold-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gold-600 border-b border-gold-500/20">
              Primary Class
            </div>
            <div
              className={`px-3 py-2 cursor-pointer hover:bg-gold-500/10 text-xs ${!char.classId ? "text-gold-400 bg-gold-500/10" : "text-gold-600"}`}
              onClick={() => { onChange({ classId: undefined }); }}
            >
              None
            </div>
            {classes.map(cls => (
              <div
                key={cls.id}
                className={`px-3 py-2 cursor-pointer hover:bg-gold-500/10 text-xs ${char.classId === cls.id ? "text-gold-400 bg-gold-500/10" : "text-gold-300"}`}
                onClick={() => { onChange({ classId: cls.id }); }}
              >
                {cls.name}
              </div>
            ))}
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gold-600 border-t border-b border-gold-500/20">
              Multiclass
            </div>
            {classes
              .filter(cls => cls.id !== char.classId)
              .map(cls => {
                const isMulti = multiclassEntries.some(m => m.classId === cls.id);
                return (
                  <div
                    key={cls.id}
                    className={`px-3 py-2 cursor-pointer hover:bg-gold-500/10 text-xs flex items-center justify-between ${isMulti ? "text-gold-400 bg-gold-500/10" : "text-gold-300"}`}
                    onClick={() => toggleMulticlass(cls.id)}
                  >
                    <span>{cls.name}</span>
                    {isMulti && <X className="h-3 w-3 text-gold-500" />}
                  </div>
                );
              })}
          </div>
        )}
      </div>
      {/* Show selected multiclass entries as chips */}
      {multiclassEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {multiclassEntries.map((entry) => {
            const cls = classes.find(c => c.id === entry.classId);
            if (!cls) return null;
            return (
              <div
                key={entry.classId}
                className="flex items-center gap-1 bg-gold-500/10 border border-gold-500/30 rounded-md px-2 py-0.5 text-[10px] text-gold-300 font-medium"
              >
                <span>{cls.name}</span>
                <X
                  className="h-3 w-3 text-gold-500 cursor-pointer hover:text-gold-300"
                  onClick={() => toggleMulticlass(entry.classId)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Grid ───────────────────────────────────────────────────────────────────
function GridNode({ node }: { node: LayoutNode }) {
  const { columns, padding, gap } = node.settings as GridSettings;
  return (
    <div
      className="grid w-full"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, padding, gap }}
    >
      {node.children.map((child) => (
        <InteractiveNode key={child.id} node={child} />
      ))}
    </div>
  );
}

// ── Auto Stats ─────────────────────────────────────────────────────────────
function AutoStatsNode({ node }: { node: LayoutNode }) {
  const { columns, padding, gap, width, statKeys } = node.settings as AutoStatsSettings;
  const { char, onChange, statDefs, ruleset } = useSheet();

  const displayDefs = statKeys && statKeys.length > 0
    ? statDefs.filter(d => statKeys.includes(d.key))
    : statDefs;

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: '100%' }) }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {displayDefs.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-3">
            <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
              No stats in ruleset
            </span>
          </div>
        ) : (
          displayDefs.map((def) => (
            <AutoStatCell key={def.key} def={def} char={char} onChange={onChange} formula={ruleset?.modifierFormula} />
          ))
        )}
      </div>
    </div>
  );
}

function AutoStatCell({ def, char, onChange, formula }: { def: StatDefinition; char: Character; onChange: (p: Partial<Character>) => void; formula?: string }) {
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
        className="w-full text-center outline-none text-gold-600 text-[11px] font-medium rounded-md px-0.5 transition-colors bg-base hover:bg-gold-500/10 cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );

  if (def.description) {
    return <Tooltip text={def.description} title={def.label}>{content}</Tooltip>;
  }
  return content;
}

// ── Auto Skills ────────────────────────────────────────────────────────────
function AutoSkillsNode({ node }: { node: LayoutNode }) {
  const { columns, padding, gap, width } = node.settings as AutoSkillsSettings;
  const { char, onChange, skills, statDefs, ruleset, vars } = useSheet();

  const evalSkillMod = (skill: RulesetSkill) => {
    const statVal = char.stats[skill.statKey] ?? 10;
    const mod = parseInt(calcModifier(statVal, ruleset?.modifierFormula)) || 0;
    const proficient = char.skillProficiencies[skill.id];
    const bonus = proficient ? char.proficiencyBonus : 0;

    if (ruleset?.skillFormula) {
      try {
        const expr = resolveHandlebars(ruleset.skillFormula, {
          ...vars,
          stat_mod: mod,
          stat_points: statVal,
          proficiency_bonus: bonus,
        });
        // eslint-disable-next-line no-new-func
        const result = Math.floor(new Function(`return (${expr})`)() as number);
        return result >= 0 ? `+${result}` : `${result}`;
      } catch { /* fall through */ }
    }
    const total = mod + bonus;
    return total >= 0 ? `+${total}` : `${total}`;
  };

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: '100%' }) }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {skills.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-3">
            <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
              No skills in ruleset
            </span>
          </div>
        ) : (
          skills.map((skill) => {
            const statDef = statDefs.find(d => d.key === skill.statKey);
            const proficient = char.skillProficiencies[skill.id] ?? false;
            return (
              <div
                key={skill.id}
                className="flex items-center gap-2 border border-gold-500/20 rounded-lg px-2 py-1 select-none justify-between cursor-pointer hover:border-gold-500/40 transition-colors"
                onClick={() => onChange({ skillProficiencies: { ...char.skillProficiencies, [skill.id]: !proficient } })}
              >
                <div className="flex items-center gap-1 min-w-0">
                  <Star className={`h-3 w-3 shrink-0 ${proficient ? "text-gold-400 fill-gold-400" : "text-gold-700"}`} />
                  <span className="text-gold-300 text-xs truncate">{skill.name || "—"}</span>
                  <span className="text-gold-600 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    ({(statDef?.label ?? skill.statKey).slice(0, 3).toUpperCase()})
                  </span>
                </div>
                <span className="text-gold-500 text-xs font-semibold shrink-0">{evalSkillMod(skill)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Auto Saving Throws ─────────────────────────────────────────────────────
function AutoSavingThrowsNode({ node }: { node: LayoutNode }) {
  const { columns, padding, gap, formula, width } = node.settings as AutoSavingThrowsSettings;
  const { char, onChange, ruleset, statDefs, vars } = useSheet();
  const tree = useTree();

  // Collect stat keys from auto-stats nodes on the tree
  const statKeys = useMemo(() => {
    const keys: string[] = [];
    const walk = (nodes: LayoutNode[]) => {
      for (const n of nodes) {
        if (n.type === "auto-stats") {
          const s = n.settings as AutoStatsSettings;
          if (s.statKeys && s.statKeys.length > 0) {
            for (const k of s.statKeys) { if (!keys.includes(k)) keys.push(k); }
          } else {
            for (const d of statDefs) { if (!keys.includes(d.key)) keys.push(d.key); }
          }
        }
        walk(n.children);
      }
    };
    walk(tree);
    if (keys.length === 0) return statDefs.map(d => d.key);
    return keys;
  }, [tree, statDefs]);

  const evalSavingThrow = (statKey: string, proficient: boolean) => {
    const statVal = char.stats[statKey] ?? 10;
    const mod = parseInt(calcModifier(statVal, ruleset?.modifierFormula)) || 0;
    const profBonus = proficient ? char.proficiencyBonus : 0;
    const f = formula || "{{stat_mod}} + {{proficiency_bonus}}";

    try {
      const expr = resolveHandlebars(f, {
        ...vars,
        stat_mod: mod,
        stat_points: statVal,
        proficiency_bonus: profBonus,
      });
      // eslint-disable-next-line no-new-func
      const result = Math.floor(new Function(`return (${expr})`)() as number);
      return result >= 0 ? `+${result}` : `${result}`;
    } catch {
      const total = mod + profBonus;
      return total >= 0 ? `+${total}` : `${total}`;
    }
  };

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: '100%' }) }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {statKeys.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-3">
            <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
              No stats defined
            </span>
          </div>
        ) : (
          statKeys.map((key) => {
            const def = statDefs.find(d => d.key === key);
            const proficient = char.savingThrowProficiencies?.[key] ?? false;
            return (
              <div
                key={key}
                className="flex flex-col items-center gap-0.5 border border-gold-500/20 rounded-lg px-1.5 py-1.5 select-none cursor-pointer hover:border-gold-500/40 transition-colors"
                onClick={() => onChange({ savingThrowProficiencies: { ...char.savingThrowProficiencies, [key]: !proficient } })}
              >
                <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider w-full text-center h-4 flex justify-center items-center gap-1">
                  <Star className={`h-3 w-3 shrink-0 ${proficient ? "text-gold-400 fill-gold-400" : "text-gold-700"}`} />
                  {(def?.label ?? key).slice(0, 3).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-gold-300 text-center w-full">
                  {evalSavingThrow(key, proficient)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Proficiency Bonus ──────────────────────────────────────────────────────
function ProficiencyBonusNode({ node }: { node: LayoutNode }) {
  const { formula, width, padding } = node.settings as ProficiencyBonusSettings;
  const { char, vars } = useSheet();

  const value = useMemo(() => {
    const defaultFormula = "Math.floor(({{level}} - 1) / 4) + 2";
    const f = formula || defaultFormula;
    const expr = resolveHandlebars(f, vars);
    try { return Math.floor(Function(`"use strict"; return (${expr})`)()) }
    catch { return char.proficiencyBonus }
  }, [formula, vars, char.proficiencyBonus]);

  return (
    <div style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}>
      <div className="flex items-center gap-2 rounded-lg border border-gold-500/20 bg px-3 py-2">
        <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
          Proficiency Bonus
        </span>
        <span className="ml-auto text-gold-300 text-sm font-bold">
          +{value}
        </span>
      </div>
    </div>
  );
}
