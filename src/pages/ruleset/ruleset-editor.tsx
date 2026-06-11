import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import { GeneralSection } from "../../components/ui/ruleset/sections/general/general";
import { StatsSection } from "../../components/ui/ruleset/sections/stats/stats";
import { SkillsSection } from "../../components/ui/ruleset/sections/skills/skills";
import { ClassesSection } from "../../components/ui/ruleset/sections/classes/classes";
import SpeciesSection from "../../components/ui/ruleset/sections/species/species";
import { TraitsSection } from "../../components/ui/ruleset/sections/traits/traits";
import { RulesSection } from "../../components/ui/ruleset/sections/rules/rules";

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

export interface RulesetClass {
  id: string;
  name: string;
  description: string;
  modifiers: RulesetClassModifier[];
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
}

const NAV_ITEMS = [
  { id: "general",  label: "General"  },
  { id: "stats",    label: "Stats"    },
  { id: "skills",   label: "Skills"   },
  { id: "classes",  label: "Classes"  },
  { id: "species",  label: "Species"  },
  { id: "traits",   label: "Traits"   },
  { id: "rules",    label: "Rules"    },
] as const;

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

export default function RulesetEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { existing?: Ruleset } | null;

  const [activeSection, setActiveSection] = useState<typeof NAV_ITEMS[number]["id"]>("general");

  const [ruleset, setRuleset] = useState<Ruleset>(() =>
    state?.existing
      ? {
          ...state.existing,
          modifierFormula: state.existing.modifierFormula || "({{stat_points}} - 10) / 2",
          skillFormula:    state.existing.skillFormula    || "{{stat_mod}} + {{proficiency_bonus}}",
          stats:           (state.existing.stats ?? []).map(s => s.id ? s : { ...s, id: crypto.randomUUID() }),
          skills:          state.existing.skills    ?? [],
          maxLevel:        state.existing.maxLevel   ?? 20,
          traits:          (state.existing.traits   ?? []).map(migrateTrait),
          species:         (state.existing.species  ?? []).map(migrateSpecie),
          rules:           (state.existing.rules    ?? []).map(r => r.id ? r : { ...r, id: crypto.randomUUID() }),
          ruleCategories:  state.existing.ruleCategories ?? [],
        }
      : {
          id: crypto.randomUUID(), name: "", description: "",
          modifierFormula: "({{stat_points}} - 10) / 2",
          skillFormula: "{{stat_mod}} + {{proficiency_bonus}}",
          maxLevel: 20, stats: [], classes: [], skills: [], traits: [], species: [], rules: [], ruleCategories: [],
        }
  );

  const handleSave = async () => {
    if (!ruleset.name.trim()) { toast.error("Ruleset name is required"); return; }
    await invoke("save_ruleset", { ruleset: { ...ruleset, name: ruleset.name.trim() } }).catch(() => {});
    toast.success("Ruleset saved");
    navigate(-1);
  };

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
        <nav className="w-44 shrink-0 border-r border-gold-500/20 flex flex-col py-3 px-2 gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                className={`w-full! h-8! text-xs! border-0! rounded-md! justify-start! px-3!
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
        </nav>

        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="w-full mx-auto flex flex-col gap-2 justify-center items-center">
            {activeSection === "general"  && <GeneralSection  ruleset={ruleset} setRuleset={setRuleset} />}
            {activeSection === "stats"    && <StatsSection    ruleset={ruleset} setRuleset={setRuleset} />}
            {activeSection === "skills"   && <SkillsSection   ruleset={ruleset} setRuleset={setRuleset} />}
            {activeSection === "classes"  && <ClassesSection  ruleset={ruleset} setRuleset={setRuleset} />}
            {activeSection === "species"  && <SpeciesSection  ruleset={ruleset} setRuleset={setRuleset} />}
            {activeSection === "traits"   && <TraitsSection   ruleset={ruleset} setRuleset={setRuleset} />}
            {activeSection === "rules"    && <RulesSection    ruleset={ruleset} setRuleset={setRuleset} />}
          </div>
        </div>
      </div>
    </main>
  );
}
