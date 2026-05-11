import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, ChevronLeft, Pencil, Plus, UserRound, Sword, ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Ruleset, StatDefinition } from "../ruleset/ruleset-editor";
import Field from "../../components/ui/Field";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export interface ClassModifier {
  name: string;
  value: number;
}

export interface CharacterClass {
  id: string;
  name: string;
  modifiers: ClassModifier[];
}

export interface Character {
  id: string;
  name: string;
  description: string;
  origin: string;
  race: string;
  classId?: string;
  rulesetId?: string;
  image?: string;
  type: "player" | "npc";
  stats: Record<string, number>;
}

const DEFAULT_STAT_DEFS: StatDefinition[] = [
  { key: "str", label: "STR", description: "" },
  { key: "dex", label: "DEX", description: "" },
  { key: "con", label: "CON", description: "" },
  { key: "int", label: "INT", description: "" },
  { key: "wis", label: "WIS", description: "" },
  { key: "cha", label: "CHA", description: "" },
];

const DEFAULT_STATS: Record<string, number> = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

function statModifier(val: number) {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharacterEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { existing?: Character } | null;
  const imgInputRef = useRef<HTMLInputElement>(null);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const rulesetDropdownRef = useRef<HTMLDivElement>(null);

  const [char, setChar] = useState<Character>(() =>
    state?.existing ?? {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      origin: "",
      race: "",
      type: "player",
      stats: { ...DEFAULT_STATS },
    }
  );

  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [showRulesetDropdown, setShowRulesetDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassModifiers, setNewClassModifiers] = useState<ClassModifier[]>([]);

  useEffect(() => {
    invoke<Ruleset[]>("list_rulesets").then(setRulesets).catch(() => {});
    invoke<CharacterClass[]>("list_classes").then(setClasses).catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showRulesetDropdown) return;
    const h = (e: MouseEvent) => { if (!rulesetDropdownRef.current?.contains(e.target as Node)) setShowRulesetDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showRulesetDropdown]);

  useEffect(() => {
    if (!showClassDropdown) return;
    const h = (e: MouseEvent) => { if (!classDropdownRef.current?.contains(e.target as Node)) setShowClassDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showClassDropdown]);

  const selectedRuleset = rulesets.find(r => r.id === char.rulesetId);
  const activeStatDefs = selectedRuleset?.stats.length ? selectedRuleset.stats : DEFAULT_STAT_DEFS;
  const activeClasses: CharacterClass[] = selectedRuleset
    ? selectedRuleset.classes
    : classes;

  const selectRuleset = (rulesetId: string | undefined) => {
    const rs = rulesets.find(r => r.id === rulesetId);
    const newStats: Record<string, number> = {};
    const defs = rs?.stats.length ? rs.stats : DEFAULT_STAT_DEFS;
    defs.forEach(s => { newStats[s.key] = char.stats[s.key] ?? 10; });
    setChar(c => ({ ...c, rulesetId, classId: undefined, stats: newStats }));
    setShowRulesetDropdown(false);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setChar(c => ({ ...c, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const setStat = (key: string, raw: string) => {
    const val = Math.max(1, Math.min(30, parseInt(raw) || 1));
    setChar(c => ({ ...c, stats: { ...c.stats, [key]: val } }));
  };

  const handleSave = async () => {
    if (!char.name.trim()) { toast.error("Name is required"); return; }
    await invoke("save_character", { character: { ...char, name: char.name.trim() } }).catch(() => {});
    toast.success("Character saved");
    navigate(-1);
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) { toast.error("Class name is required"); return; }
    const newClass: CharacterClass = {
      id: crypto.randomUUID(),
      name: newClassName.trim(),
      modifiers: newClassModifiers.filter(m => m.name.trim()),
    };
    await invoke("save_class", { class: newClass }).catch(() => {});
    setClasses(prev => [...prev, newClass]);
    setChar(c => ({ ...c, classId: newClass.id }));
    setShowCreateClass(false);
    setNewClassName("");
    setNewClassModifiers([]);
  };

  const deleteClass = async (id: string) => {
    await invoke("delete_class", { id }).catch(() => {});
    setClasses(prev => prev.filter(c => c.id !== id));
    if (char.classId === id) setChar(c => ({ ...c, classId: undefined }));
  };

  const selectedClass = activeClasses.find(c => c.id === char.classId);

  return (
    <main className="h-full min-h-screen bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
        <button className="w-9! h-9! flex items-center justify-center" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-gold-400 font-semibold text-sm">
          {state?.existing ? "Edit Character" : "New Character"}
        </h1>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 max-w-4xl mx-auto w-full">

        {/* Ruleset selector — full width floating */}
        <div className="relative" ref={rulesetDropdownRef}>
          <button
            className="w-full px-3 flex items-center justify-between gap-3 bg-surface border border-gold-500/30 rounded-xl cursor-pointer hover:border-gold-500/60 transition-colors select-none shadow-sm "
            onClick={() => setShowRulesetDropdown(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowRulesetDropdown(v => !v); }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider shrink-0">Ruleset</span>
              <span className={`text-sm truncate ${selectedRuleset ? "text-gold-200" : "text-gold-600"}`}>
                {selectedRuleset?.name ?? "No ruleset selected"}
              </span>
              {selectedRuleset?.description && (
                <span className="text-gold-700 text-xs truncate hidden sm:block">— {selectedRuleset.description}</span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-gold-600 transition-transform shrink-0 ${showRulesetDropdown ? "rotate-180" : ""}`} />
          </button>

          {showRulesetDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-surface border border-gold-500/40 rounded-xl overflow-hidden shadow-2xl">
              <div
                className={`px-4 py-2.5 cursor-pointer hover:bg-gold-500/10 transition-colors text-xs ${!char.rulesetId ? "text-gold-400 bg-gold-500/10" : "text-gold-600"}`}
                onClick={() => selectRuleset(undefined)}
              >
                No ruleset
              </div>
              {rulesets.length > 0 && <div className="border-t border-gold-500/20" />}
              {rulesets.map(rs => (
                <div
                  key={rs.id}
                  className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gold-500/10 transition-colors group/rs ${char.rulesetId === rs.id ? "bg-gold-500/15" : ""}`}
                  onClick={() => selectRuleset(rs.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gold-300 text-sm font-medium">{rs.name}</p>
                    {rs.description && <p className="text-gold-600 text-xs truncate">{rs.description}</p>}
                  </div>
                  <button
                    className="w-6! h-6! min-w-0! p-0! opacity-0 group-hover/rs:opacity-100 transition-opacity shrink-0 text-gold-500! border-gold-500/30! hover:bg-gold-500/10!"
                    onClick={(e) => { e.stopPropagation(); setShowRulesetDropdown(false); navigate("/ruleset-editor", { state: { existing: rs } }); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="border-t border-gold-500/20">
                <button
                  className="w-full! h-9! text-xs! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center gap-1.5"
                  onClick={() => { setShowRulesetDropdown(false); navigate("/ruleset-editor"); }}
                >
                  <Plus className="h-3.5 w-3.5" /> Create ruleset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="flex gap-4">

        {/* Left column */}
        <div className="flex flex-col gap-4 w-52 shrink-0">
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

          {/* Portrait */}
          <div
            className="w-full aspect-square rounded-xl border border-gold-500/30 bg-surface overflow-hidden flex flex-col items-center justify-center cursor-pointer relative group hover:border-gold-500/70 transition-colors"
            onClick={() => imgInputRef.current?.click()}
          >
            {char.image ? (
              <>
                <img src={char.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <ImagePlus className="h-5 w-5 text-gold-400" />
                  <span className="text-gold-400 text-xs">Replace</span>
                </div>
                <button
                  className="absolute top-1.5 right-1.5 w-6! h-6! min-w-0! p-0! opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setChar(c => ({ ...c, image: undefined })); }}
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gold-700 group-hover:text-gold-500 transition-colors pointer-events-none">
                <UserRound className="h-10 w-10" />
                <span className="text-xs">Add portrait</span>
              </div>
            )}
          </div>

          {/* Player / NPC toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gold-500/40">
            <button
              className={`flex-1! h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 ${char.type === "player" ? "bg-gold-500! text-gray-900!" : "bg-transparent! text-gold-500! hover:bg-gold-500/10!"}`}
              onClick={() => setChar(c => ({ ...c, type: "player" }))}
            >
              <UserRound className="h-3.5 w-3.5" /> Player
            </button>
            <div className="w-px bg-gold-500/40 shrink-0" />
            <button
              className={`flex-1! h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 ${char.type === "npc" ? "bg-gold-500! text-gray-900!" : "bg-transparent! text-gold-500! hover:bg-gold-500/10!"}`}
              onClick={() => setChar(c => ({ ...c, type: "npc" }))}
            >
              <Sword className="h-3.5 w-3.5" /> NPC
            </button>
          </div>

          {/* Stats grid */}
          <div className="bg-surface border border-gold-500/30 rounded-xl p-3 flex flex-col gap-2">
            <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">Stats</span>
            {activeStatDefs.length === 0 ? (
              <p className="text-gold-700 text-xs">No stats defined in the selected ruleset.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {activeStatDefs.map(def => (
                  <StatCell
                    key={def.key}
                    def={def}
                    val={char.stats[def.key] ?? 10}
                    onChange={(raw) => setStat(def.key, raw)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Basic info */}
          <div className="bg-surface border border-gold-500/30 rounded-xl p-4 flex flex-col gap-3">
            <Field label="Name">
              <input
                className="field-input"
                value={char.name}
                onChange={(e) => setChar(c => ({ ...c, name: e.target.value }))}
                placeholder="Character name"
              />
            </Field>

            <div className="flex gap-3">
              <Field label="Race" className="flex-1">
                <input
                  className="field-input"
                  value={char.race}
                  onChange={(e) => setChar(c => ({ ...c, race: e.target.value }))}
                  placeholder="Human, Elf, Dwarf…"
                />
              </Field>
              <Field label="Origin" className="flex-1">
                <input
                  className="field-input"
                  value={char.origin}
                  onChange={(e) => setChar(c => ({ ...c, origin: e.target.value }))}
                  placeholder="Acolyte, Soldier…"
                />
              </Field>
            </div>

            {/* Class selector */}
            <Field label="Class">
              <div className="relative" ref={classDropdownRef}>
                <div
                  className="field-input flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowClassDropdown(v => !v)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowClassDropdown(v => !v); }}
                >
                  <span className={`text-sm ${selectedClass ? "text-gold-200" : "text-gold-600"}`}>
                    {selectedClass?.name ?? "Select class…"}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-gold-600 transition-transform shrink-0 ${showClassDropdown ? "rotate-180" : ""}`} />
                </div>

                {showClassDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl">
                    {activeClasses.length === 0 && (
                      <p className="text-gold-700 text-xs px-3 py-2.5">
                        {selectedRuleset ? "No classes defined in this ruleset" : "No classes yet"}
                      </p>
                    )}
                    {activeClasses.map(cls => (
                      <div
                        key={cls.id}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gold-500/10 transition-colors group/cls ${char.classId === cls.id ? "bg-gold-500/15" : ""}`}
                        onClick={() => { setChar(c => ({ ...c, classId: cls.id })); setShowClassDropdown(false); }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gold-300 text-xs font-medium truncate">{cls.name}</p>
                          {cls.modifiers.length > 0 && (
                            <p className="text-gold-600 text-[10px] truncate">
                              {cls.modifiers.map(m => `${m.name} ${m.value >= 0 ? "+" : ""}${m.value}`).join("  ·  ")}
                            </p>
                          )}
                        </div>
                        {!selectedRuleset && (
                          <button
                            className="w-5! h-5! min-w-0! p-0! opacity-0 group-hover/cls:opacity-100 transition-opacity shrink-0 text-[#ef4444]! border-[#ef4444]/30! hover:bg-[#ef4444]/10!"
                            onClick={(e) => { e.stopPropagation(); deleteClass(cls.id); }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {!selectedRuleset && (
                      <div className="border-t border-gold-500/20">
                        <button
                          className="w-full! h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 text-gold-500! hover:bg-gold-500/10! bg-transparent!"
                          onClick={() => { setShowClassDropdown(false); setShowCreateClass(true); }}
                        >
                          <Plus className="h-3.5 w-3.5" /> Create class
                        </button>
                      </div>
                    )}
                    {selectedRuleset && (
                      <div className="border-t border-gold-500/20">
                        <button
                          className="w-full! h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 text-gold-600! hover:bg-gold-500/10! bg-transparent!"
                          onClick={() => { setShowClassDropdown(false); navigate("/ruleset-editor", { state: { existing: selectedRuleset } }); }}
                        >
                          Edit in ruleset
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Description">
              <textarea
                className="field-input resize-none"
                rows={4}
                value={char.description}
                onChange={(e) => setChar(c => ({ ...c, description: e.target.value }))}
                placeholder="Background, appearance, personality…"
              />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button className="px-5 h-9! text-xs! border-gold-500/30! text-gold-500!" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button
              className="px-5 h-9! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
              onClick={handleSave}
            >
              Save Character
            </button>
          </div>
        </div>
        </div> {/* two-column flex */}
      </div>

      {/* Create class modal (only for no-ruleset mode) */}
      {showCreateClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowCreateClass(false)}
        >
          <div
            className="bg-surface border border-gold-500/60 rounded-xl p-6 w-96 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gold-400 font-semibold text-sm">Create Class</p>

            <Field label="Class name">
              <input
                autoFocus
                className="field-input"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Fighter, Wizard, Rogue…"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateClass(); }}
              />
            </Field>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">Modifiers</span>
                <button
                  className="h-6! min-w-0! px-2! text-[10px]! gap-1! flex items-center"
                  onClick={() => setNewClassModifiers(prev => [...prev, { name: "", value: 0 }])}
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {newClassModifiers.length === 0 && (
                <p className="text-gold-700 text-xs">No modifiers — click Add to define one.</p>
              )}
              <div className="flex flex-col gap-2">
                {newClassModifiers.map((mod, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className="field-input flex-1 min-w-0"
                      placeholder="Name (e.g. STR, AC…)"
                      value={mod.name}
                      onChange={(e) => setNewClassModifiers(prev => prev.map((m, j) => j === i ? { ...m, name: e.target.value } : m))}
                    />
                    <input
                      type="number"
                      className="field-input text-center shrink-0"
                      style={{ width: "4rem" }}
                      value={mod.value}
                      onChange={(e) => setNewClassModifiers(prev => prev.map((m, j) => j === i ? { ...m, value: parseInt(e.target.value) || 0 } : m))}
                    />
                    <button
                      className="w-7! h-7! min-w-0! p-0! shrink-0 text-[#ef4444]! border-[#ef4444]/30! hover:bg-[#ef4444]/10!"
                      onClick={() => setNewClassModifiers(prev => prev.filter((_, j) => j !== i))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button className="px-4 h-8! text-xs! border-gold-500/30! text-gold-500!" onClick={() => setShowCreateClass(false)}>
                Cancel
              </button>
              <button
                className="px-4 h-8! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400!"
                onClick={handleCreateClass}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCell({ def, val, onChange }: { def: StatDefinition; val: number; onChange: (raw: string) => void }) {
  const cellRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const showTooltip = () => {
    if (cellRef.current) {
      const r = cellRef.current.getBoundingClientRect();
      setTooltipPos({ x: r.left + r.width / 2, y: r.top - 8 });
    }
  };

  return (
    <div
      ref={cellRef}
      className="flex flex-col items-center gap-0.5 bg-base border border-gold-500/20 rounded-lg pt-2 pb-1.5 px-1 cursor-pointer select-none"
      onMouseEnter={showTooltip}
      onMouseLeave={() => setTooltipPos(null)}
    >
      <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider truncate w-full text-center">
        {def.label.slice(0, 3).toUpperCase()}
      </span>
      <span className="text-xl font-light leading-tight text-gold-300">
        {statModifier(val)}
      </span>
      <input
        type="number"
        min={1}
        max={30}
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-center bg-transparent outline-none text-gold-600 text-[11px] font-medium rounded px-0.5 transition-colors hover:bg-gold-500/10 cursor-pointer select-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {tooltipPos && createPortal(
        <div
          style={{ position: "fixed", left: tooltipPos.x, top: tooltipPos.y, transform: "translate(-50%, -100%)", zIndex: 9999 }}
          className="pointer-events-none bg-surface border border-gold-500/30 rounded-lg px-3 py-2 shadow-xl w-max max-w-64"
        >
          <p className="text-gold-300 text-xs font-medium">{def.label}</p>
          {def.description && (
            <div className="text-[10px] text-gold-600 mt-0.5 [&>p]:leading-snug [&>p]:mb-2 [&>p:last-child]:mb-0 [&_li]:leading-snug [&_li_p]:my-0 [&_strong]:text-gold-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-3 [&_h1]:text-gold-300 [&_h1]:font-bold [&_h2]:text-gold-400 [&_h2]:font-semibold">
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>{def.description}</ReactMarkdown>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}