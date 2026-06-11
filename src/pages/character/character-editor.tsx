import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, ChevronLeft, Pencil, Plus, Save, UserRound, Sword } from "lucide-react";
import toast from "react-hot-toast";
import type { Ruleset, StatDefinition, RulesetSkill } from "../ruleset/ruleset-editor";
import { CharacterSheetView } from "./components/CharacterSheetView";

export interface ClassModifier {
  name: string;
  value: number;
}

export interface CharacterClass {
  id: string;
  name: string;
  description?: string;
  modifiers: ClassModifier[];
}

export interface Character {
  id: string;
  name: string;
  description: string;
  origin: string;
  race: string;
  classId?: string;
  multiclass?: { classId: string; level: number }[];
  rulesetId?: string;
  image?: string;
  type: "player" | "npc";
  stats: Record<string, number>;
  savingThrows: Record<string, number>;
  savingThrowProficiencies: Record<string, boolean>;
  skillProficiencies: Record<string, boolean>;
  inspiration: number;
  proficiencyBonus: number;
  level: number;
  armorClass: number;
  initiative: number;
  speed: number;
  customFields?: Record<string, string | number>;
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

export default function CharacterEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { existing?: Character } | null;
  const rulesetDropdownRef = useRef<HTMLDivElement>(null);

  const [char, setChar] = useState<Character>(() =>
    state?.existing
      ? { ...state.existing, level: state.existing.level ?? 1, skillProficiencies: state.existing.skillProficiencies ?? {}, savingThrowProficiencies: state.existing.savingThrowProficiencies ?? {} }
      : {
          id: crypto.randomUUID(),
          name: "",
          description: "",
          origin: "",
          race: "",
          type: "player",
          stats: { ...DEFAULT_STATS },
          savingThrows: Object.fromEntries(DEFAULT_STAT_DEFS.map(d => [d.key, 0])),
          savingThrowProficiencies: {},
          skillProficiencies: {},
          inspiration: 0,
          proficiencyBonus: 0,
          level: 1,
          armorClass: 10,
          initiative: 0,
          speed: 30,
        }
  );

  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [showRulesetDropdown, setShowRulesetDropdown] = useState(false);

  useEffect(() => {
    invoke<Ruleset[]>("list_rulesets").then(setRulesets).catch(() => {});
    invoke<CharacterClass[]>("list_classes").then(setClasses).catch(() => {});
  }, []);

  useEffect(() => {
    if (!showRulesetDropdown) return;
    const h = (e: MouseEvent) => { if (!rulesetDropdownRef.current?.contains(e.target as Node)) setShowRulesetDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showRulesetDropdown]);

  const selectedRuleset = rulesets.find(r => r.id === char.rulesetId);
  const activeStatDefs: StatDefinition[] = selectedRuleset?.stats.length ? selectedRuleset.stats : DEFAULT_STAT_DEFS;
  const activeClasses: CharacterClass[] = selectedRuleset ? selectedRuleset.classes : classes;
  const activeSkills: RulesetSkill[] = selectedRuleset?.skills ?? [];

  const selectRuleset = (rulesetId: string | undefined) => {
    const rs = rulesets.find(r => r.id === rulesetId);
    const defs = rs?.stats.length ? rs.stats : DEFAULT_STAT_DEFS;
    const newStats: Record<string, number> = {};
    defs.forEach(s => { newStats[s.key] = char.stats[s.key] ?? 10; });
    const newSavingThrows: Record<string, number> = {};
    defs.forEach(s => { newSavingThrows[s.key] = char.savingThrows?.[s.key] ?? 0; });
    setChar(c => ({ ...c, rulesetId, classId: undefined, stats: newStats, savingThrows: newSavingThrows }));
    setShowRulesetDropdown(false);
  };

  const handleSave = async () => {
    if (!char.name.trim()) { toast.error("Name is required"); return; }
    await invoke("save_character", { character: { ...char, name: char.name.trim() } }).catch(() => {});
    toast.success("Character saved");
    navigate(-1);
  };

  return (
    <main className="h-screen bg-base flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <button className="w-9! h-9! flex items-center justify-center shrink-0" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-gold-400 font-semibold text-sm shrink-0">
          {state?.existing ? "Edit Character" : "New Character"}
        </h1>
        <div className="flex-1" />

        {/* Player / NPC toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gold-500/40 shrink-0">
          <button
            className={`h-8! px-2.5! text-xs! border-0! rounded-none! flex items-center gap-1.5 ${char.type === "player" ? "bg-gold-500! text-gray-900!" : "bg-transparent! text-gold-500! hover:bg-gold-500/10!"}`}
            onClick={() => setChar(c => ({ ...c, type: "player" }))}
          >
            <UserRound className="h-3.5 w-3.5" /> Player
          </button>
          <div className="w-px bg-gold-500/40 shrink-0" />
          <button
            className={`h-8! px-2.5! text-xs! border-0! rounded-none! flex items-center gap-1.5 ${char.type === "npc" ? "bg-gold-500! text-gray-900!" : "bg-transparent! text-gold-500! hover:bg-gold-500/10!"}`}
            onClick={() => setChar(c => ({ ...c, type: "npc" }))}
          >
            <Sword className="h-3.5 w-3.5" /> NPC
          </button>
        </div>

        {/* Ruleset selector */}
        <div className="relative shrink-0" ref={rulesetDropdownRef}>
          <button
            className="h-9! px-2.5! text-xs! flex items-center gap-1.5 bg-surface! border-gold-500/30!"
            onClick={() => setShowRulesetDropdown(v => !v)}
          >
            <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">Ruleset</span>
            <span className={`max-w-28 truncate ${selectedRuleset ? "text-gold-200" : "text-gold-600"}`}>
              {selectedRuleset?.name ?? "None"}
            </span>
            <ChevronDown className={`h-3 w-3 text-gold-600 shrink-0 transition-transform ${showRulesetDropdown ? "rotate-180" : ""}`} />
          </button>
          {showRulesetDropdown && (
            <div className="absolute top-full right-0 mt-1 z-30 w-56 bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl">
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

        {/* Save */}
        <button
          className="w-9! h-9! flex items-center justify-center shrink-0 bg-gold-500! border-gold-500! text-gray-900! hover:bg-gold-400! hover:border-gold-400!"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
        </button>
      </div>
      <div className="border-b border-gold-500/20 shrink-0" />

      {/* Body — interactive sheet */}
      <div className="flex-1 max-w-4xl mx-auto w-full bg-surface border-x border-gold-500/30  overflow-auto">
        <CharacterSheetView
          char={char}
          onChange={(patch) => setChar(c => ({ ...c, ...patch }))}
          ruleset={selectedRuleset}
          statDefs={activeStatDefs}
          skills={activeSkills}
          classes={activeClasses}
          onClassCreated={(cls) => setClasses(prev => [...prev, cls])}
        />
      </div>
    </main>
  );
}
