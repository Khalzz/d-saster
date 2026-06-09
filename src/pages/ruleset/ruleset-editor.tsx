import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, Check, ChevronDown, ChevronLeft, Copy, GripVertical, Info, MoreVertical, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Field from "../../components/ui/Field";
import Modal from "../../components/ui/modal/Modal";
import { NumberInput } from "../../components/ui/NumberInput";

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

export interface RulesetSpecieTrait {
  id: string;
  name: string;
  description: string;
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
  traitIds: string[];
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

export interface Ruleset {
  id: string;
  name: string;
  description: string;
  modifierFormula: string;
  skillFormula: string;
  savingThrowFormula: string;
  maxLevel: number;
  stats: StatDefinition[];
  classes: RulesetClass[];
  skills: RulesetSkill[];
  traits: RulesetSpecieTrait[];
  species: RulesetSpecie[];
}

const SIDEBAR_SECTIONS = [
  { id: "rs-base",           label: "Base Information" },
  { id: "rs-char-creation",  label: "Character creation", children: ["rs-char-data", "rs-stats", "rs-saving-throws", "rs-classes", "rs-skills", "rs-traits", "rs-sheet"] },
  { id: "rs-char-data",      label: "Char. Data",     indent: true, parent: "rs-char-creation" },
  { id: "rs-stats",          label: "Stats",          indent: true, parent: "rs-char-creation" },
  { id: "rs-saving-throws",  label: "Saving Throws",  indent: true, parent: "rs-char-creation" },
  { id: "rs-classes",        label: "Classes",        indent: true, parent: "rs-char-creation" },
  { id: "rs-skills",         label: "Skills",         indent: true, parent: "rs-char-creation" },
  { id: "rs-races",          label: "Species",        indent: true, parent: "rs-char-creation" },
  { id: "rs-traits",         label: "Traits",         indent: true, parent: "rs-char-creation" },
  { id: "rs-sheet",          label: "Sheet Layout",   indent: true, parent: "rs-char-creation" },
];

const HANDLEBAR_VARS: { key: string; description: string }[] = [
  { key: "stat_points",       description: "Raw stat value (e.g. 15)" },
  { key: "stat_mod",          description: "Computed modifier — result of the modifier formula" },
  { key: "level",             description: "Character level" },
  { key: "proficiency_bonus", description: "Character proficiency bonus" },
  { key: "inspiration",       description: "Character inspiration value" },
];

export default function RulesetEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { existing?: Ruleset } | null;

  const [activeSection, setActiveSection] = useState<string>("rs-base");
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());
  const toggleParent = (id: string) =>
    setCollapsedParents(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  useEffect(() => {
    const scrollEl = document.getElementById("ruleset-scroll-area");
    if (!scrollEl) return;

    const onScroll = () => {
      const checkpoint = scrollEl.getBoundingClientRect().top + 80;
      let current = SIDEBAR_SECTIONS[0].id as string;
      for (const { id } of SIDEBAR_SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= checkpoint) current = id;
      }
      setActiveSection(current);
    };

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);

  const [ruleset, setRuleset] = useState<Ruleset>(() =>
    state?.existing
      ? { ...state.existing, modifierFormula: state.existing.modifierFormula || "({{stat_points}} - 10) / 2", skillFormula: state.existing.skillFormula || "{{stat_mod}} + {{proficiency_bonus}}", savingThrowFormula: state.existing.savingThrowFormula || "{{stat_mod}} + {{proficiency_bonus}}", skills: state.existing.skills ?? [], maxLevel: state.existing.maxLevel ?? 20, traits: state.existing.traits ?? [], species: state.existing.species ?? [] }
      : { id: crypto.randomUUID(), name: "", description: "", modifierFormula: "({{stat_points}} - 10) / 2", skillFormula: "{{stat_mod}} + {{proficiency_bonus}}", savingThrowFormula: "{{stat_mod}} + {{proficiency_bonus}}", maxLevel: 20, stats: [], classes: [], skills: [], traits: [], species: [] }
  );

  const handleSave = async () => {
    if (!ruleset.name.trim()) { toast.error("Ruleset name is required"); return; }
    await invoke("save_ruleset", { ruleset: { ...ruleset, name: ruleset.name.trim() } }).catch(() => {});
    toast.success("Ruleset saved");
    navigate(-1);
  };

  const [dragStatIdx, setDragStatIdx] = useState<number | null>(null);

  const statsListRef = useRef<HTMLDivElement>(null);
  const prevStatCount = useRef(0);
  const [lastAddedStatId, setLastAddedStatId] = useState<string | null>(null);
  useEffect(() => {
    if (ruleset.stats.length > prevStatCount.current)
      statsListRef.current?.scrollTo({ top: statsListRef.current.scrollHeight, behavior: "smooth" });
    prevStatCount.current = ruleset.stats.length;
  }, [ruleset.stats.length]);

  const classesListRef = useRef<HTMLDivElement>(null);
  const prevClassCount = useRef(0);
  const [lastAddedClassId, setLastAddedClassId] = useState<string | null>(null);
  useEffect(() => {
    if (ruleset.classes.length > prevClassCount.current)
      classesListRef.current?.scrollTo({ top: classesListRef.current.scrollHeight, behavior: "smooth" });
    prevClassCount.current = ruleset.classes.length;
  }, [ruleset.classes.length]);

  const skillsListRef = useRef<HTMLDivElement>(null);
  const prevSkillCount = useRef(0);
  const [lastAddedSkillId, setLastAddedSkillId] = useState<string | null>(null);
  useEffect(() => {
    if (ruleset.skills.length > prevSkillCount.current)
      skillsListRef.current?.scrollTo({ top: skillsListRef.current.scrollHeight, behavior: "smooth" });
    prevSkillCount.current = ruleset.skills.length;
  }, [ruleset.skills.length]);

  // ── Stats helpers ──────────────────────────────────────────────────
  const addStat = () => {
    const id = crypto.randomUUID();
    setLastAddedStatId(id);
    setRuleset(r => ({ ...r, stats: [...r.stats, { id, key: "", label: "", description: "" }] }));
  };

  const updateStat = (i: number, patch: Partial<StatDefinition>) =>
    setRuleset(r => ({ ...r, stats: r.stats.map((s, j) => j === i ? { ...s, ...patch } : s) }));

  const removeStat = (i: number) =>
    setRuleset(r => ({ ...r, stats: r.stats.filter((_, j) => j !== i) }));

  const duplicateStat = (i: number) => {
    const id = crypto.randomUUID();
    setLastAddedStatId(id);
    setRuleset(r => {
      const stats = [...r.stats];
      stats.splice(i + 1, 0, { ...stats[i], id });
      return { ...r, stats };
    });
  };

  const moveStatTo = (from: number, to: number) => {
    setRuleset(r => {
      const stats = [...r.stats];
      const [item] = stats.splice(from, 1);
      stats.splice(to, 0, item);
      return { ...r, stats };
    });
    setDragStatIdx(to);
  };

  // ── Specie helpers ─────────────────────────────────────────────────
  const [specieModal, setSpecieModal] = useState<{ race: RulesetSpecie; isNew: boolean } | null>(null);

  const openNewSpecie = () => setSpecieModal({
    isNew: true,
    race: {
      id: crypto.randomUUID(), name: "", size: ["medium"], description: "",
      unit: "ft", movements: [], senses: [], traitIds: [],
      statModifiers: {},
      damageResistances: [], damageImmunities: [], conditionImmunities: [], damageVulnerabilities: [],
    },
  });

  const saveSpecie = (race: RulesetSpecie) => {
    const exists = ruleset.species.some(x => x.id === race.id);
    const updated = { ...ruleset, species: exists ? ruleset.species.map(x => x.id === race.id ? race : x) : [...ruleset.species, race] };
    setRuleset(updated);
    invoke("save_ruleset", { ruleset: updated }).catch(() => {});
    setSpecieModal(null);
  };

  const removeSpecie = (id: string) => {
    const updated = { ...ruleset, species: ruleset.species.filter(x => x.id !== id) };
    setRuleset(updated);
    invoke("save_ruleset", { ruleset: updated }).catch(() => {});
  };

  // ── Class helpers ──────────────────────────────────────────────────
  const addTrait = () => {
    const id = crypto.randomUUID();
    setRuleset(r => ({ ...r, traits: [...r.traits, { id, name: "", description: "" }] }));
  };

  const updateTrait = (i: number, p: Partial<RulesetSpecieTrait>) =>
    setRuleset(r => ({ ...r, traits: r.traits.map((t, j) => j === i ? { ...t, ...p } : t) }));

  const removeTrait = (i: number) =>
    setRuleset(r => ({ ...r, traits: r.traits.filter((_, j) => j !== i) }));

  const addClass = () => {
    const id = crypto.randomUUID();
    setLastAddedClassId(id);
    setRuleset(r => ({ ...r, classes: [...r.classes, { id, name: "", description: "", modifiers: [] }] }));
  };

  const updateClass = (i: number, patch: Partial<RulesetClass>) =>
    setRuleset(r => ({ ...r, classes: r.classes.map((c, j) => j === i ? { ...c, ...patch } : c) }));

  const removeClass = (i: number) =>
    setRuleset(r => ({ ...r, classes: r.classes.filter((_, j) => j !== i) }));

  const duplicateClass = (i: number) => {
    const id = crypto.randomUUID();
    setLastAddedClassId(id);
    setRuleset(r => {
      const classes = [...r.classes];
      classes.splice(i + 1, 0, { ...classes[i], id });
      return { ...r, classes };
    });
  };

  // ── Skill helpers ──────────────────────────────────────────────────
  const addSkill = () => {
    const id = crypto.randomUUID();
    setLastAddedSkillId(id);
    setRuleset(r => ({ ...r, skills: [...r.skills, { id, name: "", statKey: r.stats[0]?.key ?? "", description: "" }] }));
  };

  const updateSkill = (i: number, patch: Partial<RulesetSkill>) =>
    setRuleset(r => ({ ...r, skills: r.skills.map((s, j) => j === i ? { ...s, ...patch } : s) }));

  const removeSkill = (i: number) =>
    setRuleset(r => ({ ...r, skills: r.skills.filter((_, j) => j !== i) }));

  const duplicateSkill = (i: number) => {
    const id = crypto.randomUUID();
    setLastAddedSkillId(id);
    setRuleset(r => {
      const skills = [...r.skills];
      skills.splice(i + 1, 0, { ...skills[i], id });
      return { ...r, skills };
    });
  };


  return (
    <main className="h-full min-h-screen bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
        <button className="w-9! h-9! flex items-center justify-center" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-gold-400 font-semibold text-sm">
          {state?.existing ? "Edit Ruleset" : "New Ruleset"}
        </h1>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto py-6 scroll-pt-3" id="ruleset-scroll-area">
        <div className="max-w-3xl mx-auto px-4 flex gap-6 items-start">

          {/* Sidebar index */}
          <nav className="w-32 shrink-0 sticky top-6 flex flex-col gap-0.5 pt-1">
            {SIDEBAR_SECTIONS.map(s => {
              const isActive = activeSection === s.id;
              const hasChildren = "children" in s;
              const hasParent = "parent" in s;
              const isParentOfActive = hasChildren && (s as { children: string[] }).children.includes(activeSection);
              const isHighlighted = isActive || isParentOfActive;
              const isCollapsed = hasChildren && collapsedParents.has(s.id);
              const parentCollapsed = hasParent && collapsedParents.has((s as { parent: string }).parent);
              const baseBtn = `text-left border-0! outline-none! ring-0! active:ring-0! bg-transparent! text-xs justify-start py-1 px-0! h-auto! transition-all duration-150 ease-in-out`;
              const highlight = isHighlighted ? "text-gold-300! opacity-100" : "text-gold-400! opacity-40 hover:opacity-70";

              if (hasChildren) {
                return (
                  <button
                    key={s.id}
                    className={`${baseBtn} w-full! font-semibold flex items-center gap-1.5 ${highlight}`}
                    onClick={() => toggleParent(s.id)}
                  >
                    <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-300 ${isCollapsed ? "-rotate-90" : ""}`} />
                    {s.label}
                  </button>
                );
              }

              if (hasParent) {
                return (
                  <div
                    key={s.id}
                    className={`grid transition-all duration-150 ease-in-out ${parentCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
                  >
                    <div className="overflow-hidden">
                      <button
                        className={`${baseBtn} pl-3! ${highlight}`}
                        onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      >
                        {s.label}
                      </button>
                    </div>
                  </div>
                );
              }

              // plain top-level (no children, no parent)
              return (
                <button
                  key={s.id}
                  className={`${baseBtn} font-semibold ${highlight}`}
                  onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* ── Base Information ── */}
          <div id="rs-base" className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-1">
              <h2 className="text-gold-400 text-[1rem] font-bold shrink-0">Base Information</h2>
              <div className="flex-1 h-px bg-gold-500/20" />
            </div>
            <Section title="General" defaultOpen>
              <div className="flex flex-col gap-3">
                <Field label="Name">
                  <input
                    className=" "
                    value={ruleset.name}
                    onChange={(e) => setRuleset(r => ({ ...r, name: e.target.value }))}
                    placeholder="D&D 5e, Anima, Pathfinder…"
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className="  resize-none"
                    rows={3}
                    value={ruleset.description}
                    onChange={(e) => setRuleset(r => ({ ...r, description: e.target.value }))}
                    placeholder="Briefly describe this ruleset…"
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* ── Character Creation group ── */}
          <div id="rs-char-creation" className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-1">
              <h2 className="text-gold-400 text-[1rem] font-bold shrink-0">Character creation</h2>
              <div className="flex-1 h-px bg-gold-500/20" />
            </div>

          {/* ── Character Data ── */}
          <Section id="rs-char-data" title="Character Data" defaultOpen>
            <Field label="Max Level">
              <input
                type="number"
                min={1}
                max={100}
                className=" "
                value={ruleset.maxLevel}
                onChange={(e) => {
                  const n = parseInt(e.target.value);
                  if (!isNaN(n) && n >= 1) setRuleset(r => ({ ...r, maxLevel: n }));
                }}
              />
            </Field>
          </Section>

          {/* ── Stats ── */}
          <Section id="rs-stats" title="Stats" defaultOpen>
            <div className="flex flex-col gap-4">

              {/* Global modifier formula */}
              <FormulaInput
                label="Modifier formula"
                value={ruleset.modifierFormula}
                onChange={(v) => setRuleset(r => ({ ...r, modifierFormula: v }))}
                placeholder="({{stat_points}} - 10) / 2"
              />

              <div className="flex flex-col gap-2">
                <span className="text-gold-400 text-sm font-semibold">Stat list</span>
                {ruleset.stats.length === 0 && (
                  <p className="text-gold-700 text-xs">No stats defined yet.</p>
                )}
                <div className="flex flex-col gap-2">
                  {ruleset.stats.map((stat, i) => (
                    <StatCard
                      key={stat.id ?? i}
                      stat={stat}
                      onUpdate={(patch) => updateStat(i, patch)}
                      onRemove={() => removeStat(i)}
                      onDuplicate={() => duplicateStat(i)}
                      isDragging={dragStatIdx === i}
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragStatIdx(i); }}
                      onDragEnd={() => setDragStatIdx(null)}
                      onDragOver={(e) => { e.preventDefault(); if (dragStatIdx !== null && dragStatIdx !== i) moveStatTo(dragStatIdx, i); }}
                      focusOnMount={stat.id === lastAddedStatId}
                    />
                  ))}
                </div>
                <button
                  className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border-dashed! border-gold-500/30! text-gold-600! hover:border-gold-500/60! hover:text-gold-400! hover:bg-transparent!"
                  onClick={addStat}
                >
                  <Plus className="h-3 w-3" /> Add Stat
                </button>
              </div>
            </div>
          </Section>
          <Section id="rs-saving-throws" title="Saving Throws" defaultOpen>
            <div className="flex flex-col gap-4">
              <FormulaInput
                label="Saving Throw formula"
                value={ruleset.savingThrowFormula}
                onChange={(v) => setRuleset(r => ({ ...r, savingThrowFormula: v }))}
                placeholder="{{stat_mod}} + {{proficiency_bonus}}"
              />
            </div>
          </Section>
          <Section id="rs-classes" title="Classes" defaultOpen>
            <div className="border border-gold-500/20 rounded-lg overflow-hidden">
              {ruleset.classes.length === 0 ? (
                <p className="text-gold-700 text-xs px-3 py-3">No classes defined yet.</p>
              ) : (
                <div ref={classesListRef} className="max-h-72 overflow-y-auto p-2 space-y-2">
                  {ruleset.classes.map((cls, ci) => (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      onNameChange={(name) => updateClass(ci, { name })}
                      onDescriptionChange={(description) => updateClass(ci, { description })}
                      onDelete={() => removeClass(ci)}
                      onDuplicate={() => duplicateClass(ci)}
                      focusOnMount={cls.id === lastAddedClassId}
                    />
                  ))}
                </div>
              )}
              <div className="border-t border-gold-500/10">
                <button
                  className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border-0! rounded-none! text-gold-600! hover:text-gold-400! hover:bg-gold-500/5!"
                  onClick={addClass}
                >
                  <Plus className="h-3 w-3" /> Add Class
                </button>
              </div>
            </div>
          </Section>
          <Section id="rs-skills" title="Skills" defaultOpen>
            <div className="flex flex-col gap-4">
              <FormulaInput
                label="Skill formula"
                value={ruleset.skillFormula}
                onChange={(v) => setRuleset(r => ({ ...r, skillFormula: v }))}
                placeholder="{{stat_mod}} + {{proficiency_bonus}}"
              />
              <div className="flex flex-col gap-2">
                <span className="text-gold-400 text-sm font-semibold">Skill list</span>
                <div className="border border-gold-500/20 rounded-lg overflow-hidden">
                  {ruleset.skills.length === 0 ? (
                    <p className="text-gold-700 text-xs px-3 py-3">No skills defined yet.</p>
                  ) : (
                    <div ref={skillsListRef} className="max-h-72 overflow-y-auto p-2 space-y-2">
                      {ruleset.skills.map((skill, i) => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          stats={ruleset.stats}
                          onUpdate={(patch) => updateSkill(i, patch)}
                          onDelete={() => removeSkill(i)}
                          onDuplicate={() => duplicateSkill(i)}
                          focusOnMount={skill.id === lastAddedSkillId}
                        />
                      ))}
                    </div>
                  )}
                  <div className="border-t border-gold-500/10">
                    <button
                      className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border-0! rounded-none! text-gold-600! hover:text-gold-400! hover:bg-gold-500/5!"
                      onClick={addSkill}
                    >
                      <Plus className="h-3 w-3" /> Add Skill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Section>
          <Section id="rs-races" title="Species" defaultOpen>
            <div className="border border-gold-500/20 rounded-lg overflow-hidden">
              {ruleset.species.length === 0 ? (
                <p className="text-gold-700 text-xs px-3 py-3">No species defined yet.</p>
              ) : (
                <div className="p-2 flex flex-col gap-1.5">
                  {ruleset.species.map((race) => (
                    <div
                      key={race.id}
                      className="flex items-center gap-2 border border-gold-500/20 rounded-lg px-3 py-2 cursor-pointer hover:border-gold-500/40 transition-colors"
                      onClick={() => setSpecieModal({ race: { ...race, traitIds: race.traitIds ?? [] }, isNew: false })}
                    >
                      <span className="text-gold-300 text-sm font-medium flex-1 truncate">{race.name || "Unnamed specie"}</span>
                      <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider border border-gold-500/20 rounded px-1.5 py-0.5">{race.size.join(", ") || "—"}</span>
                      <button
                        type="button"
                        className="w-6! h-6! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! shrink-0"
                        onClick={(e) => { e.stopPropagation(); removeSpecie(race.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-gold-500/10">
                <button
                  className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border-0! rounded-none! text-gold-600! hover:text-gold-400! hover:bg-gold-500/5!"
                  onClick={openNewSpecie}
                >
                  <Plus className="h-3 w-3" /> Add Specie
                </button>
              </div>
            </div>
          </Section>

          <Section id="rs-traits" title="Traits" defaultOpen>
            <div className="border border-gold-500/20 rounded-lg overflow-hidden">
              {ruleset.traits.length === 0 ? (
                <p className="text-gold-700 text-xs px-3 py-3">No traits defined yet.</p>
              ) : (
                <div className="p-2 space-y-2">
                  {ruleset.traits.map((trait, i) => (
                    <TraitCard
                      key={trait.id}
                      trait={trait}
                      onUpdate={p => updateTrait(i, p)}
                      onDelete={() => removeTrait(i)}
                    />
                  ))}
                </div>
              )}
              <div className="border-t border-gold-500/10">
                <button
                  className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border-0! rounded-none! text-gold-600! hover:text-gold-400! hover:bg-gold-500/5!"
                  onClick={addTrait}
                >
                  <Plus className="h-3 w-3" /> Add Trait
                </button>
              </div>
            </div>
          </Section>

          {specieModal && (
            <SpecieModal
              race={specieModal.race}
              isNew={specieModal.isNew}
              stats={ruleset.stats}
              availableTraits={ruleset.traits}
              onCreateTrait={name => {
                const id = crypto.randomUUID();
                const newTrait: RulesetSpecieTrait = { id, name, description: "" };
                setRuleset(r => ({ ...r, traits: [...r.traits, newTrait] }));
                return id;
              }}
              onSave={saveSpecie}
              onClose={() => setSpecieModal(null)}
            />
          )}

          <Section id="rs-sheet" title="Character Sheet" defaultOpen>
            <div className="flex flex-col gap-3">
              <p className="text-gold-600 text-xs leading-relaxed">
                Define the layout of the character sheet for this ruleset.
              </p>
              <button
                className="w-full! h-9! text-xs! gap-1.5! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
                onClick={() => navigate("/sheet-editor", { state: { rulesetId: ruleset.id } })}
              >
                Create Character Sheet
              </button>
            </div>
          </Section>
          </div>{/* end character creation group */}

          {/* Actions */}
          <div className="flex justify-end gap-2 pb-2">
            <button className="px-5 h-9! text-xs! border-gold-500/30! text-gold-500!" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button
              className="px-5 h-9! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
              onClick={handleSave}
            >
              Save Ruleset
            </button>
          </div>

          </div>{/* end main content */}

        </div>{/* end flex row */}
      </div>{/* end scroll area */}
    </main>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function Section({ id, title, defaultOpen = false, children }: {
  id?: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="border border-gold-500/30 rounded-xl overflow-hidden h-fit">
      <button
        className="w-full! border-0! rounded-none! bg-surface! text-left! flex items-center justify-between px-4 py-3 hover:bg-gold-500/5!"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-gold-400 text-sm font-semibold">{title}</span>
        <ChevronDown className={`h-4 w-4 text-gold-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-200 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-3 py-3 bg-base/60 border-t border-gold-500/20">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassCard({ cls, onNameChange, onDescriptionChange, onDelete, onDuplicate, focusOnMount = false }: {
  cls: RulesetClass;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  focusOnMount?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);

  useEffect(() => {
    if (focusOnMount) nameInputRef.current?.focus();
  }, []);

  const openMenu = () => {
    const r = menuBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < 80 && r.top > spaceBelow)
      setMenuPos({ bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right });
    else
      setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  return (
    <div className="border border-gold-500/20 rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 px-1.5 py-2 bg-surface/40">
        <button
          className="w-4! h-4! min-w-0! p-0! bg-transparent! border-0! outline-none! ring-0! active:ring-0! text-gold-600! hover:text-gold-400! shrink-0"
          onClick={() => setOpen(v => !v)}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        <input
          ref={nameInputRef}
          className="bg-transparent outline-none border-0 text-gold-300 text-sm font-medium leading-snug flex-1 p-0 m-0 placeholder:text-gold-700/50"
          value={cls.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Class name…"
        />
        <button
          ref={menuBtnRef}
          className="w-6! h-6! min-w-0! p-0! shrink-0 bg-transparent! border-0! outline-none! ring-0! active:ring-0! text-gold-600! hover:text-gold-400!"
          onClick={openMenu}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className={`grid transition-all duration-200 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-3 py-3 bg-base/60 border-t border-gold-500/20">
            <textarea
              className="bg-transparent outline-none border-0 text-gold-600 text-[11px] w-full resize-none leading-relaxed p-0 m-0 placeholder:text-gold-700/40 overflow-y-auto max-h-75"
              style={{ fieldSizing: "content" } as React.CSSProperties}
              value={cls.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe this class…"
              rows={1}
            />
          </div>
        </div>
      </div>

      {menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={() => setMenuPos(null)} />
          <div
            style={{ position: "fixed", top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right, width: 148, zIndex: 999 }}
            className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl flex flex-col"
          >
            <button
              className="w-full! h-8! text-[11px]! border-0! rounded-none! bg-transparent! text-gold-300! hover:bg-gold-500/10! flex items-center gap-2 px-3! justify-start!"
              onClick={() => { onDuplicate(); setMenuPos(null); }}
            >
              <Copy className="h-3.5 w-3.5 text-gold-400 shrink-0" /> Duplicate
            </button>
            <div className="border-t border-gold-500/10" />
            <button
              className="w-full! h-8! text-[11px]! border-0! rounded-none! bg-transparent! text-[#ef4444]! hover:bg-[#ef4444]/10! flex items-center gap-2 px-3! justify-start!"
              onClick={() => { onDelete(); setMenuPos(null); }}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" /> Delete
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}


function HandlebarInput({
  value,
  onChange,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onChange: (v: string) => void;
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

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        className={className}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setDropdown(null), 120)}
        {...rest}
      />
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

function FormulaInput({
  label = "Formula",
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const infoRef = useRef<HTMLButtonElement>(null);
  const warnRef = useRef<SVGSVGElement>(null);
  const checkRef = useRef<SVGSVGElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [statusTooltip, setStatusTooltip] = useState<{ top: number; left: number; type: "warn" | "ok" } | null>(null);

  const opens  = (value.match(/\{\{/g)  ?? []).length;
  const closes = (value.match(/\}\}/g) ?? []).length;
  const balanced = opens === closes;
  const valid = value.length > 0 && balanced;
  const warn  = value.length > 0 && !balanced;

  const showStatusTooltip = (ref: React.RefObject<SVGSVGElement | null>, type: "warn" | "ok") => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setStatusTooltip({ top: r.bottom + 6, left: r.left, type });
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-gold-400 text-sm font-semibold">{label}</span>
          <button
            ref={infoRef}
            className="w-4! h-4! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-gold-500! shrink-0"
            onMouseEnter={() => {
              const r = infoRef.current?.getBoundingClientRect();
              if (r) setTooltipPos({ top: r.bottom + 6, left: r.left });
            }}
            onMouseLeave={() => setTooltipPos(null)}
          >
            <Info className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <HandlebarInput
            className="  font-mono text-xs flex-1"
            value={value}
            onChange={onChange}
            placeholder={placeholder ?? "Enter formula…"}
          />
          {valid && (
            <Check
              ref={checkRef}
              className="h-3.5 w-3.5 text-emerald-500 shrink-0 cursor-default"
              onMouseEnter={() => showStatusTooltip(checkRef, "ok")}
              onMouseLeave={() => setStatusTooltip(null)}
            />
          )}
          {warn && (
            <AlertCircle
              ref={warnRef}
              className="h-3.5 w-3.5 text-amber-500 shrink-0 cursor-default"
              onMouseEnter={() => showStatusTooltip(warnRef, "warn")}
              onMouseLeave={() => setStatusTooltip(null)}
            />
          )}
        </div>
      </div>

      {tooltipPos && createPortal(
        <div
          style={{ position: "fixed", top: tooltipPos.top, left: tooltipPos.left, zIndex: 999 }}
          className="bg-surface border border-gold-500/30 rounded-lg px-3 py-2 shadow-xl max-w-56 pointer-events-none"
        >
          <p className="text-gold-400 text-[11px] font-medium mb-1">Handlebars formula</p>
          <p className="text-gold-600 text-[10px] leading-relaxed">
            Write a math expression using <code className="text-gold-300 font-mono bg-gold-500/10 px-0.5 rounded">{"{{variable}}"}</code> syntax. Type <code className="text-gold-300 font-mono bg-gold-500/10 px-0.5 rounded">{"{{"}</code> to pick a variable.
          </p>
        </div>,
        document.body
      )}

      {statusTooltip && createPortal(
        <div
          style={{ position: "fixed", top: statusTooltip.top, left: statusTooltip.left, zIndex: 999 }}
          className="bg-surface border rounded-lg px-3 py-2 shadow-xl max-w-64 pointer-events-none border-gold-500/30"
        >
          {statusTooltip.type === "warn" ? (
            <>
              <p className="text-amber-400 text-[11px] font-medium mb-1">Unclosed handlebars</p>
              <p className="text-gold-600 text-[10px] leading-relaxed">
                Every <code className="text-gold-300 font-mono bg-gold-500/10 px-0.5 rounded">{"{{"}  </code> must be closed with <code className="text-gold-300 font-mono bg-gold-500/10 px-0.5 rounded">{"}}"}</code>.
              </p>
            </>
          ) : (
            <>
              <p className="text-emerald-400 text-[11px] font-medium mb-1">Formula looks good</p>
              <p className="text-gold-600 text-[10px] leading-relaxed">
                All handlebars are balanced — variables will be substituted at runtime.
              </p>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

function StatCard({ stat, onUpdate, onRemove, onDuplicate, isDragging, onDragStart, onDragEnd, onDragOver, focusOnMount = false }: {
  stat: StatDefinition;
  onUpdate: (patch: Partial<StatDefinition>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  focusOnMount?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);

  useEffect(() => {
    if (focusOnMount) nameInputRef.current?.focus();
  }, []);

  const openMenu = () => {
    const r = menuBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < 80 && r.top > spaceBelow)
      setMenuPos({ bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right });
    else
      setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  return (
    <div
      className={`border border-gold-500/20 rounded-lg overflow-hidden flex transition-opacity ${isDragging ? "opacity-40" : ""}`}
      onDragOver={onDragOver}
      onDrop={(e) => e.preventDefault()}
    >
      {/* Drag handle — left lateral strip */}
      <div
        draggable
        className="border-r border-gold-500/20 bg-surface/60 flex items-center justify-center cursor-grab active:cursor-grabbing text-gold-700 hover:text-gold-500 transition-colors shrink-0"
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Card content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-0.5 px-1.5 py-2 bg-surface/40">
          <button
            className="w-4! h-4! min-w-0! p-0! bg-transparent! border-0! outline-none! ring-0! active:ring-0! text-gold-600! hover:text-gold-400! shrink-0"
            onClick={() => setOpen(v => !v)}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
          <input
            ref={nameInputRef}
            className="bg-transparent outline-none border-0 text-gold-300 text-sm font-medium leading-snug flex-1 p-0 m-0 placeholder:text-gold-700/50"
            value={stat.label}
            onChange={(e) => {
              const label = e.target.value;
              onUpdate({ label, key: label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") });
            }}
            placeholder="Write the stat name here…"
          />
          <button
            ref={menuBtnRef}
            className="w-6! h-6! min-w-0! p-0! shrink-0 bg-transparent! border-0! outline-none! ring-0! active:ring-0! text-gold-600! hover:text-gold-400!"
            onClick={openMenu}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className={`grid transition-all duration-200 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="px-3 py-3 bg-base/60 border-t border-gold-500/20">
              <textarea
                className="bg-transparent outline-none border-0 text-gold-600 text-[11px] w-full resize-none leading-relaxed p-0 m-0 placeholder:text-gold-700/40 overflow-y-auto max-h-48"
                style={{ fieldSizing: "content" } as React.CSSProperties}
                value={stat.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Describe this stat…"
                rows={1}
              />
            </div>
          </div>
        </div>
      </div>

      {menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={() => setMenuPos(null)} />
          <div
            style={{ position: "fixed", top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right, width: 148, zIndex: 999 }}
            className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl flex flex-col"
          >
            <button
              className="w-full! h-8! text-[11px]! border-0! rounded-none! bg-transparent! text-gold-300! hover:bg-gold-500/10! flex items-center gap-2 px-3! justify-start!"
              onClick={() => { onDuplicate(); setMenuPos(null); }}
            >
              <Copy className="h-3.5 w-3.5 text-gold-400 shrink-0" /> Duplicate
            </button>
            <div className="border-t border-gold-500/10" />
            <button
              className="w-full! h-8! text-[11px]! border-0! rounded-none! bg-transparent! text-[#ef4444]! hover:bg-[#ef4444]/10! flex items-center gap-2 px-3! justify-start!"
              onClick={() => { onRemove(); setMenuPos(null); }}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" /> Delete
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}


const RESISTANCE_SECTIONS = [
  { key: "damageResistances"    as const, label: "Damage Resistances"     },
  { key: "damageImmunities"     as const, label: "Damage Immunities"      },
  { key: "conditionImmunities"  as const, label: "Condition Immunities"   },
  { key: "damageVulnerabilities"as const, label: "Damage Vulnerabilities" },
];

function SpecieModal({ race: initial, isNew, stats, availableTraits, onCreateTrait, onSave, onClose }: {
  race: RulesetSpecie;
  isNew: boolean;
  stats: StatDefinition[];
  availableTraits: RulesetSpecieTrait[];
  onCreateTrait: (name: string) => string;
  onSave: (race: RulesetSpecie) => void;
  onClose: () => void;
}) {
  const [race, setRace] = useState<RulesetSpecie>(initial);
  const patch = (p: Partial<RulesetSpecie>) => setRace(r => ({ ...r, ...p }));
  const unitLabel = race.unit;
  const [traitPickerOpen, setTraitPickerOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [activeSections, setActiveSections] = useState<Set<typeof RESISTANCE_SECTIONS[number]["key"]>>(
    () => new Set(RESISTANCE_SECTIONS.filter(s => initial[s.key].length > 0).map(s => s.key))
  );
  const addSectionBtnRef = useRef<HTMLButtonElement>(null);
  const [sectionPickerPos, setSectionPickerPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const isDirty = JSON.stringify(race) !== JSON.stringify(initial);
  const handleClose = () => { if (isDirty) setShowConfirm(true); else onClose(); };

  const SIZE_DATA: Record<string, { ft: string; m: string }> = {
    tiny:       { ft: "2.5 × 2.5 ft",  m: "0.75 × 0.75 m" },
    small:      { ft: "5 × 5 ft",      m: "1.5 × 1.5 m"   },
    medium:     { ft: "5 × 5 ft",      m: "1.5 × 1.5 m"   },
    large:      { ft: "10 × 10 ft",    m: "3 × 3 m"       },
    huge:       { ft: "15 × 15 ft",    m: "4.5 × 4.5 m"   },
    gargantuan: { ft: "20 × 20 ft+",   m: "6 × 6 m+"      },
  };

  const sizeTriggerRef = useRef<HTMLDivElement>(null);
  const [sizeDropdownPos, setSizeDropdownPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  const openSizeDropdown = () => {
    const r = sizeTriggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < 160 && r.top > spaceBelow)
      setSizeDropdownPos({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width });
    else
      setSizeDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  const inputCls = "bg-base border border-gold-500/30 rounded-md px-2 text-xs text-gold-400 w-full outline-none focus:border-gold-500/50 caret-gold-500";
  const inputLineCls = `${inputCls} h-9 py-2`;


  return (
    <Modal isOpen={true} onClose={handleClose}>
      <div className="relative bg-surface border border-gold-500/20 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Discard confirmation overlay */}
        {showConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <p className="text-gold-300 font-semibold text-sm">Discard changes?</p>
              <p className="text-gold-600 text-xs">You have unsaved changes. They will be lost if you close now.</p>
              <div className="flex gap-2">
                <button className="px-4! h-8! text-xs! border-gold-500/30! text-gold-500!" onClick={() => setShowConfirm(false)}>Keep editing</button>
                <button className="px-4! h-8! text-xs! bg-[#ef4444]/10! border-[#ef4444]! text-[#ef4444]! hover:bg-[#ef4444]/20!" onClick={onClose}>Discard</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
          <h2 className="text-gold-300 font-semibold text-sm flex-1">{isNew ? "New Specie" : "Edit Specie"}</h2>
          <div className="flex gap-1">
            {(["ft","m"] as const).map(u => (
              <button key={u} type="button"
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-colors ${race.unit === u ? "border-gold-500 text-gold-400 bg-gold-500/10" : "border-gold-500/20 text-gold-600 hover:border-gold-500/40"}`}
                onClick={() => {
                  if (race.unit === u) return;
                  const toM = u === "m";
                  patch({
                    unit: u,
                    movements: race.movements.map(m => ({
                      ...m,
                      value: toM
                        ? Math.round(m.value * 0.3048 * 10) / 10
                        : Math.round(m.value / 0.3048),
                    })),
                  });
                }}
              >{u}</button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

          {/* ── Identity ── */}
          <ModalSection title="Identity">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <input className={inputLineCls} value={race.name} onChange={e => patch({ name: e.target.value })} placeholder="e.g. Human, Elf, Dwarf…" />
                </Field>
                <Field label="Size">
                  <div
                    ref={sizeTriggerRef}
                    className={`${inputLineCls} flex items-center gap-1.5 flex-wrap cursor-pointer select-none`}
                    onClick={openSizeDropdown}
                  >
                    {race.size.length ? race.size.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-full px-2 py-px text-[10px] font-medium bg-gold-500/15 text-gold-300 border border-gold-500/30">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        <span className="text-gold-600">({SIZE_DATA[s]?.[race.unit]})</span>
                      </span>
                    )) : <span className="text-gold-700">None</span>}
                    <ChevronDown className="h-3 w-3 text-gold-600 shrink-0 ml-auto" />
                  </div>
                  {sizeDropdownPos && createPortal(
                    <>
                      <div className="fixed inset-0 z-[998]" onClick={() => setSizeDropdownPos(null)} />
                      <div
                        style={{ position: "fixed", top: sizeDropdownPos.top, bottom: sizeDropdownPos.bottom, left: sizeDropdownPos.left, width: sizeDropdownPos.width, zIndex: 999 }}
                        className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl"
                      >
                        {(Object.keys(SIZE_DATA) as Array<keyof typeof SIZE_DATA>).map(s => {
                          const active = race.size.includes(s as never);
                          return (
                            <div
                              key={s}
                              className={`px-3 py-2 cursor-pointer text-xs flex items-center gap-2 hover:bg-gold-500/10 transition-colors ${active ? "text-gold-300" : "text-gold-500"}`}
                              onClick={() => patch({ size: active ? race.size.filter(x => x !== s) : [...race.size, s] } as Partial<RulesetSpecie>)}
                            >
                              {active ? <Check className="h-3 w-3 shrink-0" /> : <span className="w-3 shrink-0" />}
                              <span className="flex-1">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                              <span className="text-gold-700 text-[10px]">({SIZE_DATA[s][race.unit]})</span>
                            </div>
                          );
                        })}
                      </div>
                    </>,
                    document.body
                  )}
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  className="w-full rounded-md px-2.5 py-2 border border-gold-500/20 bg-base text-gold-200 text-xs resize-y outline-none focus:border-gold-500/40 transition-colors placeholder:text-gold-700 font-sans"
                  rows={3}
                  value={race.description}
                  onChange={e => patch({ description: e.target.value })}
                  placeholder="Describe this specie…"
                />
              </Field>
            </div>
          </ModalSection>

          {/* ── Movement Speeds ── */}
          <ModalSection title="Movement Speeds">
            <div className="flex flex-wrap gap-2">
              {race.movements.map((mov, i) => (
                <div key={i} className="flex flex-1 basis-40 items-center justify-between gap-2 border border-gold-500/20 rounded-lg p-1 px-2">
                  <input
                    className="flex-1 min-w-0 bg-transparent text-gold-500 text-xs font-bold tracking-wider outline-none placeholder:text-gold-700 caret-gold-500"
                    value={mov.label}
                    onChange={e => {
                      const updated = race.movements.map((m, j) => j === i ? { ...m, label: e.target.value } : m);
                      patch({ movements: updated });
                    }}
                    placeholder="Walk, Fly…"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <NumberInput
                      value={mov.value}
                      onChange={v => {
                        const updated = race.movements.map((m, j) => j === i ? { ...m, value: v } : m);
                        patch({ movements: updated });
                      }}
                      min={0}
                      suffix={unitLabel}
                      className="w-20"
                    />
                    <button
                      type="button"
                      className="w-6! h-6! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! shrink-0"
                      onClick={() => patch({ movements: race.movements.filter((_, j) => j !== i) })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border! border-dashed! border-gold-500/20! rounded-lg! text-gold-600! hover:text-gold-400! hover:border-gold-500/40!"
                onClick={() => patch({ movements: [...race.movements, { label: "", value: 0 }] })}
              >
                <Plus className="h-3 w-3" /> Add Movement
              </button>
            </div>
          </ModalSection>

          {/* ── Traits ── */}
          <ModalSection title="Traits">
            <div className="flex flex-col gap-2">
              {race.traitIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {race.traitIds.map(id => {
                    const trait = availableTraits.find(t => t.id === id);
                    if (!trait) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-px text-xs font-medium bg-gold-500/15 text-gold-300 border border-gold-500/30">
                        {trait.name || <span className="italic text-gold-600">Unnamed</span>}
                        <button
                          type="button"
                          className="border-0! bg-transparent! p-0! min-w-0! w-auto! h-auto! shrink-0 opacity-60 hover:opacity-100 text-gold-300!"
                          onClick={() => patch({ traitIds: race.traitIds.filter(i => i !== id) })}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border! border-dashed! border-gold-500/20! rounded-lg! text-gold-600! hover:text-gold-400! hover:border-gold-500/40!"
                onClick={() => setTraitPickerOpen(true)}
              >
                <Plus className="h-3 w-3" /> Add Trait
              </button>
            </div>
            {traitPickerOpen && (
              <TraitPickerModal
                availableTraits={availableTraits}
                selectedIds={race.traitIds}
                onToggle={id => patch({ traitIds: race.traitIds.includes(id) ? race.traitIds.filter(i => i !== id) : [...race.traitIds, id] })}
                onCreate={name => {
                  const id = onCreateTrait(name);
                  patch({ traitIds: [...race.traitIds, id] });
                }}
                onClose={() => setTraitPickerOpen(false)}
              />
            )}
          </ModalSection>

          {/* ── Resistances & Immunities ── */}
          <ModalSection title="Resistances & Immunities">
            <div className="flex flex-col gap-3">
              {RESISTANCE_SECTIONS.filter(s => activeSections.has(s.key)).map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gold-500 text-[11px] font-semibold">{label}</span>
                    <button
                      type="button"
                      className="w-5! h-5! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! shrink-0"
                      onClick={() => {
                        setActiveSections(s => { const n = new Set(s); n.delete(key); return n; });
                        patch({ [key]: [] });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <TagInput value={race[key]} onChange={v => patch({ [key]: v })} />
                </div>
              ))}
              {activeSections.size < RESISTANCE_SECTIONS.length && (
                <button
                  ref={addSectionBtnRef}
                  type="button"
                  className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border! border-dashed! border-gold-500/20! rounded-lg! text-gold-600! hover:text-gold-400! hover:border-gold-500/40!"
                  onClick={() => {
                    const r = addSectionBtnRef.current?.getBoundingClientRect();
                    if (r) setSectionPickerPos({ top: r.bottom + 4, left: r.left, width: r.width });
                  }}
                >
                  <Plus className="h-3 w-3" /> Add section
                </button>
              )}
            </div>
            {sectionPickerPos && createPortal(
              <>
                <div className="fixed inset-0 z-998" onClick={() => setSectionPickerPos(null)} />
                <div
                  style={{ position: "fixed", top: sectionPickerPos.top, left: sectionPickerPos.left, width: sectionPickerPos.width, zIndex: 999 }}
                  className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl"
                >
                  {RESISTANCE_SECTIONS.filter(s => !activeSections.has(s.key)).map(({ key, label }) => (
                    <div
                      key={key}
                      className="px-3 py-2 cursor-pointer text-xs text-gold-400 hover:bg-gold-500/10 hover:text-gold-300 transition-colors"
                      onClick={() => {
                        setActiveSections(s => new Set([...s, key]));
                        setSectionPickerPos(null);
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </>,
              document.body
            )}
          </ModalSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gold-500/20 shrink-0">
          <button className="px-4! h-8! text-xs! border-gold-500/30! text-gold-500!" onClick={handleClose}>Cancel</button>
          <button
            className="px-4! h-8! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
            onClick={() => onSave(race)}
          >
            {isNew ? "Add Specie" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-md border border-gold-500/30 p-3">
      <span className="absolute top-0 left-3 h-2 flex items-center -translate-y-1/2 px-1.5 bg-surface text-[10px] font-semibold uppercase tracking-widest text-gold-500/50 select-none">
        {title}
      </span>
      {children}
    </div>
  );
}

function SkillCard({ skill, stats, onUpdate, onDelete, onDuplicate, focusOnMount = false }: {
  skill: RulesetSkill;
  stats: StatDefinition[];
  onUpdate: (patch: Partial<RulesetSkill>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  focusOnMount?: boolean;
}) {
  const statTriggerRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [statDropdownPos, setStatDropdownPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [descOpen, setDescOpen] = useState(false);

  useEffect(() => {
    if (focusOnMount) nameInputRef.current?.focus();
  }, []);

  const selectedStat = stats.find(s => s.key === skill.statKey);

  const openStatDropdown = () => {
    const r = statTriggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < 160 && r.top > spaceBelow)
      setStatDropdownPos({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width });
    else
      setStatDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  const openMenu = () => {
    const r = menuBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < 80 && r.top > spaceBelow)
      setMenuPos({ bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right });
    else
      setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  return (
    <div className="border border-gold-500/20 rounded-lg overflow-hidden bg-surface/40">
      <div className="flex items-center gap-0.5 px-1.5 py-2 bg-surface/40">
        <button
          className="w-4! h-4! min-w-0! p-0! bg-transparent! border-0! outline-none! ring-0! active:ring-0! text-gold-600! hover:text-gold-400! shrink-0"
          onClick={() => setDescOpen(v => !v)}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${descOpen ? "rotate-180" : ""}`} />
        </button>
        <input
          ref={nameInputRef}
          className="bg-transparent outline-none border-0 text-gold-300 text-sm font-medium leading-snug flex-1 p-0 m-0 placeholder:text-gold-700/50"
          value={skill.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Skill name…"
        />
        <div
          ref={statTriggerRef}
          className="flex items-center justify-between gap-1.5 bg-surface border border-gold-500/20 rounded-lg px-2 py-1 cursor-pointer select-none hover:border-gold-500/50 transition-colors w-32 shrink-0"
          onClick={openStatDropdown}
        >
          <span className={`text-xs truncate ${selectedStat ? "text-gold-300" : "text-gold-600"}`}>
            {selectedStat?.label ?? "Select stat…"}
          </span>
          <ChevronDown className="h-3 w-3 text-gold-600 shrink-0" />
        </div>
        <button
          ref={menuBtnRef}
          className="w-6! h-6! min-w-0! p-0! shrink-0 bg-transparent! border-0! outline-none! ring-0! active:ring-0! text-gold-600! hover:text-gold-400!"
          onClick={openMenu}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className={`grid transition-all duration-200 ease-in-out ${descOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-3 py-3 bg-base/60 border-t border-gold-500/20">
            <textarea
              className="bg-transparent outline-none border-0 text-gold-600 text-[11px] w-full resize-none leading-relaxed p-0 m-0 placeholder:text-gold-700/40 overflow-y-auto max-h-48"
              style={{ fieldSizing: "content" } as React.CSSProperties}
              value={skill.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Describe this skill…"
              rows={1}
            />
          </div>
        </div>
      </div>

      {/* Stat selector dropdown */}
      {statDropdownPos && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={() => setStatDropdownPos(null)} />
          <div
            style={{ position: "fixed", top: statDropdownPos.top, bottom: statDropdownPos.bottom, left: statDropdownPos.left, width: statDropdownPos.width, zIndex: 999 }}
            className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl max-h-36 flex flex-col"
          >
            <div className="overflow-y-auto flex-1">
              {stats.length === 0
                ? <p className="text-gold-700 text-xs px-3 py-2">No stats defined yet</p>
                : stats.map(s => (
                  <div
                    key={s.key}
                    className={`px-3 py-2 cursor-pointer text-xs hover:bg-gold-500/10 transition-colors ${skill.statKey === s.key ? "text-gold-300 bg-gold-500/15" : "text-gold-400"}`}
                    onClick={() => { onUpdate({ statKey: s.key }); setStatDropdownPos(null); }}
                  >
                    {s.label}
                  </div>
                ))
              }
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Action menu */}
      {menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={() => setMenuPos(null)} />
          <div
            style={{ position: "fixed", top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right, width: 148, zIndex: 999 }}
            className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl flex flex-col"
          >
            <button
              className="w-full! h-8! text-[11px]! border-0! rounded-none! bg-transparent! text-gold-300! hover:bg-gold-500/10! flex items-center gap-2 px-3! justify-start!"
              onClick={() => { onDuplicate(); setMenuPos(null); }}
            >
              <Copy className="h-3.5 w-3.5 text-gold-400 shrink-0" /> Duplicate
            </button>
            <div className="border-t border-gold-500/10" />
            <button
              className="w-full! h-8! text-[11px]! border-0! rounded-none! bg-transparent! text-[#ef4444]! hover:bg-[#ef4444]/10! flex items-center gap-2 px-3! justify-start!"
              onClick={() => { onDelete(); setMenuPos(null); }}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" /> Delete
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}


function TraitPickerModal({ availableTraits, selectedIds, onToggle, onCreate, onClose }: {
  availableTraits: RulesetSpecieTrait[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = availableTraits.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );
  const canCreate = query.trim() !== "" && !availableTraits.some(t => t.name.toLowerCase() === query.trim().toLowerCase());

  return createPortal(
    <div className="fixed inset-0 z-200 backdrop-blur-lg flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
        <div className="w-130 bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 overflow-hidden">
          <input
            ref={inputRef}
            className="w-full h-14 text-xl border-none! bg-transparent! text-gold-300 outline-none px-4 placeholder:text-gold-700 caret-gold-500"
            placeholder="Search traits…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto border-t border-gold-500/20">
            {filtered.length === 0 && !canCreate && (
              <p className="text-gold-700 text-xs px-4 py-3">No traits found.</p>
            )}
            {filtered.map(trait => {
              const active = selectedIds.includes(trait.id);
              return (
                <div
                  key={trait.id}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gold-500/10 transition-colors ${active ? "bg-gold-500/10" : ""}`}
                  onClick={() => onToggle(trait.id)}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${active ? "bg-gold-500 border-gold-500" : "border-gold-500/30"}`}>
                    {active && <Check className="h-3 w-3 text-gray-900" />}
                  </span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-sm font-medium ${active ? "text-gold-300" : "text-gold-400"}`}>
                      {trait.name || <span className="italic text-gold-700">Unnamed</span>}
                    </span>
                    {trait.description && (
                      <span className="text-gold-600 text-xs truncate">{trait.description}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {canCreate && (
          <button
            className="flex items-center gap-1.5 text-sm px-3!"
            onClick={() => { onCreate(query.trim()); setQuery(""); onClose(); }}
          >
            <Plus className="h-3 w-3" /> Create "{query.trim()}"
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

function TraitCard({ trait, onUpdate, onDelete }: {
  trait: RulesetSpecieTrait;
  onUpdate: (p: Partial<RulesetSpecieTrait>) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gold-500/20 rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 px-1.5 py-2 bg-surface/40">
        <button
          className="w-4! h-4! min-w-0! p-0! bg-transparent! border-0! outline-none! ring-0! active:ring-0! text-gold-600! hover:text-gold-400! shrink-0"
          onClick={() => setOpen(v => !v)}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        <input
          className="bg-transparent outline-none border-0 text-gold-300 text-sm font-medium leading-snug flex-1 p-0 m-0 placeholder:text-gold-700/50"
          value={trait.name}
          onChange={e => onUpdate({ name: e.target.value })}
          placeholder="Trait name…"
        />
        <button
          className="w-6! h-6! min-w-0! p-0! shrink-0 bg-transparent! border-0! outline-none! ring-0! active:ring-0! text-gold-700! hover:text-[#ef4444]!"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className={`grid transition-all duration-200 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-3 py-3 bg-base/60 border-t border-gold-500/20">
            <textarea
              className="bg-transparent outline-none border-0 text-gold-600 text-[11px] w-full resize-none leading-relaxed p-0 m-0 placeholder:text-gold-700/40 overflow-y-auto max-h-40"
              style={{ fieldSizing: "content" } as React.CSSProperties}
              value={trait.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Describe this trait…"
              rows={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border border-gold-500/20 rounded-lg p-1.5 min-h-8">
      {value.map((v, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full px-2.5 py-px text-xs font-medium bg-gold-500/15 text-gold-300 border border-gold-500/30">
          {v}
          <button
            type="button"
            className="border-0! bg-transparent! p-0! min-w-0! w-auto! h-auto! shrink-0 opacity-60 hover:opacity-100 text-gold-300!"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-24 bg-transparent text-xs text-gold-400 outline-none caret-gold-500 placeholder:text-gold-700"
        value={input}
        placeholder="Type and press Enter…"
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
      />
    </div>
  );
}
