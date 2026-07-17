import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { GeneralSection } from "../../components/ui/ruleset/sections/general/general";
import { StatsSection } from "../../components/ui/ruleset/sections/stats/stats";
import { SkillsSection } from "../../components/ui/ruleset/sections/skills/skills";
import { ClassesSection } from "../../components/ui/ruleset/sections/classes/classes";
import SpeciesSection from "../../components/ui/ruleset/sections/species/species";
import { TraitsSection } from "../../components/ui/ruleset/sections/traits/traits";
import { RulesSection } from "../../components/ui/ruleset/sections/rules/rules";
import { SectionHeader } from "../../components/ui/ruleset/sections/section-header";
import { Markdown } from "../../components/ui/Markdown";

export interface StatDefinition {
  id?: string;
  key: string;
  label: string;
  description: string;
}

export interface RulesetClassModifier {
  name: string;
  value: number;
}

export interface TraitFieldDef {
  id: string;
  label: string;
}

export function traitFieldKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function applyTraitFieldValues(
  description: string,
  fields: TraitFieldDef[],
  values: Record<string, string>,
): string {
  return fields.reduce((desc, f) => {
    const key = traitFieldKey(f.label);
    return key ? desc.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), values[f.id] ?? "") : desc;
  }, description);
}

export interface TraitAssignment {
  traitId: string;
  values: Record<string, string>;
}

export interface RulesetSpecieTrait {
  id: string;
  name: string;
  description: string;
  fields: TraitFieldDef[];
}

export interface RulesetSpecie {
  id: string;
  name: string;
  size: Array<"tiny" | "small" | "medium" | "large" | "huge" | "gargantuan">;
  description: string;
  unit: "ft" | "m";
  movements: { label: string; value: number }[];
  senses: { label: string; value: number }[];
  statModifiers: Record<string, number>;
  traitAssignments: TraitAssignment[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  damageVulnerabilities: string[];
}

export interface RulesetClassLevelFeature {
  level: number;
  traitIds: string[];
}

export interface RulesetClass {
  id: string;
  name: string;
  description: string;
  modifiers: RulesetClassModifier[];
  primaryAbility: string;
  hitDie: string;
  savingThrowProficiencies: string[];
  skillProficiencies: { count: number; options: string[] };
  levelFeatures: RulesetClassLevelFeature[];
  image?: string;
  color?: string;
  featureTable?: {
    columns: { id: string; label: string; type?: "text" | "traits"; autofill?: boolean }[];
    rows: { id: string; cells: Record<string, string | string[]> }[];
  };
}

export interface RulesetSkill {
  id: string;
  name: string;
  statKey: string;
  description: string;
}

export interface RulesetRule {
  id: string;
  name: string;
  description: string;
  category?: string;
}

export interface RulesetCustomSection {
  id: string;
  name: string;
  content: string;
}

export interface Ruleset {
  id: string;
  name: string;
  description: string;
  modifierFormula: string;
  skillFormula: string;
  maxLevel: number;
  stats: StatDefinition[];
  classes: RulesetClass[];
  skills: RulesetSkill[];
  traits: RulesetSpecieTrait[];
  species: RulesetSpecie[];
  rules: RulesetRule[];
  ruleCategories: string[];
  customSections: RulesetCustomSection[];
}

const NAV_ITEMS = [
  { id: "classes",  label: "Classes"  },
  { id: "general",  label: "General"  },
  { id: "rules",    label: "Rules"    },
  { id: "skills",   label: "Skills"   },
  { id: "species",  label: "Species"  },
  { id: "stats",    label: "Stats"    },
  { id: "traits",   label: "Traits"   },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateClass(c: any): RulesetClass {
  return {
    ...c,
    primaryAbility:           c.primaryAbility           ?? "",
    hitDie:                   c.hitDie                   ?? "",
    savingThrowProficiencies: c.savingThrowProficiencies ?? [],
    skillProficiencies:       c.skillProficiencies       ?? { count: 0, options: [] },
    levelFeatures:            c.levelFeatures            ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateSpecie(sp: any): RulesetSpecie {
  const base = sp.id ? sp : { ...sp, id: crypto.randomUUID() };
  const traitAssignments: TraitAssignment[] =
    base.traitAssignments ??
    (base.traitIds ?? []).map((id: string) => ({ traitId: id, values: {} }));
  return { ...base, traitAssignments };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateTrait(t: any): RulesetSpecieTrait {
  const base = t.id ? t : { ...t, id: crypto.randomUUID() };
  return { ...base, fields: base.fields ?? [] };
}

// Split-pane markdown notes for a custom section: raw text on the left,
// live-rendered preview on the right, always both visible and updating on
// every keystroke.
function CustomSectionContent({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  return (
    <div className="flex-1 min-h-0 flex gap-6">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your system here"
        className="w-1/2 h-full m-0 p-0 bg-transparent border-none outline-none resize-none text-gold-200 text-sm leading-relaxed placeholder:text-gold-700 placeholder:italic"
      />
      <div className="w-px bg-gold-500/20 shrink-0" />
      <div className="w-1/2 h-full overflow-y-auto">
        {content.trim()
          ? <Markdown>{content}</Markdown>
          : <p className="m-0 text-gold-700 text-sm italic">Preview will appear here</p>}
      </div>
    </div>
  );
}

export default function RulesetEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { existing?: Ruleset } | null;

  const [activeSection, setActiveSection] = useState<string>("classes");
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [ruleset, setRuleset] = useState<Ruleset>(() =>
    state?.existing
      ? {
          ...state.existing,
          modifierFormula: state.existing.modifierFormula || "({{stat_points}} - 10) / 2",
          skillFormula:    state.existing.skillFormula    || "{{stat_mod}} + {{proficiency_bonus}}",
          stats:           (state.existing.stats ?? []).map(s => s.id ? s : { ...s, id: crypto.randomUUID() }),
          skills:          state.existing.skills    ?? [],
          classes:         (state.existing.classes  ?? []).map(migrateClass),
          maxLevel:        state.existing.maxLevel   ?? 20,
          traits:          (state.existing.traits   ?? []).map(migrateTrait),
          species:         (state.existing.species  ?? []).map(migrateSpecie),
          rules:           (state.existing.rules    ?? []).map(r => r.id ? r : { ...r, id: crypto.randomUUID() }),
          ruleCategories:  state.existing.ruleCategories ?? [],
          customSections:  (state.existing.customSections ?? []).map(s => ({ ...s, content: s.content ?? "" })),
        }
      : {
          id: crypto.randomUUID(), name: "", description: "",
          modifierFormula: "({{stat_points}} - 10) / 2",
          skillFormula: "{{stat_mod}} + {{proficiency_bonus}}",
          maxLevel: 20, stats: [], classes: [], skills: [], traits: [], species: [], rules: [], ruleCategories: [],
          customSections: [],
        }
  );

  const handleSave = async () => {
    if (!ruleset.name.trim()) { toast.error("Ruleset name is required"); return; }
    await invoke("save_ruleset", { ruleset: { ...ruleset, name: ruleset.name.trim() } }).catch(() => {});
    toast.success("Ruleset saved");
    navigate(-1);
  };

  const addCustomSection = () => {
    const section: RulesetCustomSection = { id: crypto.randomUUID(), name: "New System", content: "" };
    setRuleset(r => ({ ...r, customSections: [...r.customSections, section] }));
    setActiveSection(section.id);
    setRenamingSectionId(section.id);
    setRenameValue(section.name);
  };

  const commitSectionRename = (id: string, name: string) => {
    const trimmed = name.trim();
    if (trimmed) {
      setRuleset(r => ({ ...r, customSections: r.customSections.map(s => s.id === id ? { ...s, name: trimmed } : s) }));
    }
    setRenamingSectionId(null);
  };

  const deleteCustomSection = (id: string) => {
    setRuleset(r => ({ ...r, customSections: r.customSections.filter(s => s.id !== id) }));
    if (activeSection === id) setActiveSection("classes");
  };

  const activeCustomSection = ruleset.customSections.find(s => s.id === activeSection);

  return (
    <main className="h-screen bg-base flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
        <button className="w-9! h-9! flex items-center justify-center" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-gold-400 font-semibold text-sm">
          {state?.existing ? "Edit Ruleset" : "New Ruleset"}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="h-8! text-xs! px-3! gap-1.5! border-gold-500/40! text-gold-400!"
            onClick={() => navigate("/sheet-editor", { state: { rulesetId: ruleset.id } })}
          >
            Edit Sheet
          </button>
          <div className="w-px h-4 bg-gold-500/20 shrink-0" />
          <button className="px-4! h-8! text-xs! border-gold-500/30! text-gold-500!" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            className="px-4! h-8! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <nav className="w-44 shrink-0 border-r border-gold-500/20 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-3 h-9 border-b border-gold-500/20 bg-surface shrink-0">
            <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">Systems</span>
            <button
              onClick={addCustomSection}
              className="w-6! h-6! p-0! flex items-center justify-center text-gold-600 hover:text-gold-300 transition-colors shrink-0"
              title="New system"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {NAV_ITEMS.map(item => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                className={`w-full! h-9! text-xs! border-0! rounded-none! justify-start! px-3!
                  ${active
                    ? "bg-gold-500/15! text-gold-300! font-semibold!"
                    : "bg-transparent! text-gold-500! hover:bg-gold-500/8! hover:text-gold-400!"
                  }`}
                onClick={() => setActiveSection(item.id)}
              >
                {item.label}
              </button>
            );
          })}

          {ruleset.customSections.length > 0 && (
            <div className="border-t border-gold-500/20 flex flex-col">
              {ruleset.customSections.map(section => {
                const active = activeSection === section.id;
                const renaming = renamingSectionId === section.id;
                return (
                  <div
                    key={section.id}
                    className={`group flex items-center gap-1 h-9 px-3 cursor-pointer
                      ${active ? "bg-gold-500/15" : "hover:bg-gold-500/8"}`}
                    onClick={() => !renaming && setActiveSection(section.id)}
                    onDoubleClick={() => { setRenamingSectionId(section.id); setRenameValue(section.name); }}
                  >
                    {renaming ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitSectionRename(section.id, renameValue)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitSectionRename(section.id, renameValue);
                          if (e.key === "Escape") setRenamingSectionId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none p-0 m-0 text-xs text-gold-200"
                      />
                    ) : (
                      <span className={`flex-1 min-w-0 truncate text-xs ${active ? "text-gold-300 font-semibold" : "text-gold-500"}`}>
                        {section.name}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCustomSection(section.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gold-700 hover:text-red-400 transition-opacity shrink-0"
                      title="Delete system"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {activeSection === "general"  && <GeneralSection  ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "stats"    && <StatsSection    ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "skills"   && <SkillsSection   ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "classes"  && <ClassesSection  ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "species"  && <SpeciesSection  ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "traits"   && <TraitsSection   ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "rules"    && <RulesSection    ruleset={ruleset} setRuleset={setRuleset} />}
          {activeCustomSection && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <SectionHeader title={activeCustomSection.name} />
              <div className="flex-1 min-h-0 flex flex-col p-4">
                <div className="w-4xl mx-auto flex-1 min-h-0 flex">
                  <CustomSectionContent
                    content={activeCustomSection.content}
                    onChange={(content) => setRuleset(r => ({
                      ...r,
                      customSections: r.customSections.map(s => s.id === activeCustomSection.id ? { ...s, content } : s),
                    }))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
