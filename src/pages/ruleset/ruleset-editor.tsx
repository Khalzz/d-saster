import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, ChevronLeft, GripVertical, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Field from "../../components/ui/Field";

export interface StatDefinition {
  key: string;
  label: string;
  description: string;
}

export interface RulesetClassModifier {
  name: string;
  value: number;
}

export interface RulesetClass {
  id: string;
  name: string;
  modifiers: RulesetClassModifier[];
}

export interface Ruleset {
  id: string;
  name: string;
  description: string;
  stats: StatDefinition[];
  classes: RulesetClass[];
}

export default function RulesetEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { existing?: Ruleset } | null;

  const [ruleset, setRuleset] = useState<Ruleset>(() =>
    state?.existing ?? {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      stats: [],
      classes: [],
    }
  );

  const handleSave = async () => {
    if (!ruleset.name.trim()) { toast.error("Ruleset name is required"); return; }
    await invoke("save_ruleset", { ruleset: { ...ruleset, name: ruleset.name.trim() } }).catch(() => {});
    toast.success("Ruleset saved");
    navigate(-1);
  };

  const [dragStatIdx, setDragStatIdx] = useState<number | null>(null);

  // ── Stats helpers ──────────────────────────────────────────────────
  const addStat = () =>
    setRuleset(r => ({ ...r, stats: [...r.stats, { key: "", label: "", description: "" }] }));

  const updateStat = (i: number, patch: Partial<StatDefinition>) =>
    setRuleset(r => ({ ...r, stats: r.stats.map((s, j) => j === i ? { ...s, ...patch } : s) }));

  const removeStat = (i: number) =>
    setRuleset(r => ({ ...r, stats: r.stats.filter((_, j) => j !== i) }));

  const moveStatTo = (from: number, to: number) => {
    setRuleset(r => {
      const stats = [...r.stats];
      const [item] = stats.splice(from, 1);
      stats.splice(to, 0, item);
      return { ...r, stats };
    });
    setDragStatIdx(to);
  };

  // ── Class helpers ──────────────────────────────────────────────────
  const addClass = () =>
    setRuleset(r => ({ ...r, classes: [...r.classes, { id: crypto.randomUUID(), name: "", modifiers: [] }] }));

  const updateClass = (i: number, patch: Partial<RulesetClass>) =>
    setRuleset(r => ({ ...r, classes: r.classes.map((c, j) => j === i ? { ...c, ...patch } : c) }));

  const removeClass = (i: number) =>
    setRuleset(r => ({ ...r, classes: r.classes.filter((_, j) => j !== i) }));

  const addModifier = (ci: number) =>
    updateClass(ci, { modifiers: [...ruleset.classes[ci].modifiers, { name: "", value: 0 }] });

  const updateModifier = (ci: number, mi: number, patch: Partial<RulesetClassModifier>) =>
    updateClass(ci, {
      modifiers: ruleset.classes[ci].modifiers.map((m, j) => j === mi ? { ...m, ...patch } : m),
    });

  const removeModifier = (ci: number, mi: number) =>
    updateClass(ci, { modifiers: ruleset.classes[ci].modifiers.filter((_, j) => j !== mi) });

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
      <div className="flex-1 min-h-0 overflow-y-auto justify-center items-center w-full mx-auto px-4 py-6 space-y-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {/* ── Base Information ── */}
          <Section title="Base Information" defaultOpen>
            <div className="flex flex-col gap-3">
              <Field label="Name">
                <input
                  className="field-input"
                  value={ruleset.name}
                  onChange={(e) => setRuleset(r => ({ ...r, name: e.target.value }))}
                  placeholder="D&D 5e, Anima, Pathfinder…"
                />
              </Field>
              <Field label="Description">
                <textarea
                  className="field-input resize-none"
                  rows={3}
                  value={ruleset.description}
                  onChange={(e) => setRuleset(r => ({ ...r, description: e.target.value }))}
                  placeholder="Briefly describe this ruleset…"
                />
              </Field>
            </div>
          </Section>

          {/* ── Character Creation ── */}
          <Section title="Character Creation" defaultOpen>
            <div className="flex flex-col gap-6">

              {/* Stats */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-gold-500 text-xs font-semibold uppercase tracking-wider">Stats</span>
                  <button className="h-7! min-w-0! px-2! text-[11px]! gap-1! flex items-center" onClick={addStat}>
                    <Plus className="h-3 w-3" /> Add stat
                  </button>
                </div>

                {ruleset.stats.length === 0 && (
                  <p className="text-gold-700 text-xs">No stats defined yet.</p>
                )}

                <div className="flex flex-col gap-2">
                  {ruleset.stats.map((stat, i) => (
                    <StatCard
                      key={i}
                      stat={stat}
                      onUpdate={(patch) => updateStat(i, patch)}
                      onRemove={() => removeStat(i)}
                      isDragging={dragStatIdx === i}
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragStatIdx(i); }}
                      onDragEnd={() => setDragStatIdx(null)}
                      onDragOver={(e) => { e.preventDefault(); if (dragStatIdx !== null && dragStatIdx !== i) moveStatTo(dragStatIdx, i); }}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-gold-500/20" />

              {/* Classes */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-gold-500 text-xs font-semibold uppercase tracking-wider">Classes</span>
                  <button className="h-7! min-w-0! px-2! text-[11px]! gap-1! flex items-center" onClick={addClass}>
                    <Plus className="h-3 w-3" /> Add class
                  </button>
                </div>

                {ruleset.classes.length === 0 && (
                  <p className="text-gold-700 text-xs">No classes defined yet.</p>
                )}

                <div className="flex flex-col gap-2">
                  {ruleset.classes.map((cls, ci) => (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      onNameChange={(name) => updateClass(ci, { name })}
                      onDelete={() => removeClass(ci)}
                      onAddModifier={() => addModifier(ci)}
                      onUpdateModifier={(mi, patch) => updateModifier(ci, mi, patch)}
                      onRemoveModifier={(mi) => removeModifier(ci, mi)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Section>
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
        </div>


        
      </div>
    </main>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function Section({ title, defaultOpen = false, children }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gold-500/30 rounded-xl overflow-hidden h-fit">
      <button
        className="w-full! border-0! rounded-none! bg-surface! text-left! flex items-center justify-between px-4 py-3 hover:bg-gold-500/5!"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-gold-400 text-sm font-semibold">{title}</span>
        <ChevronDown className={`h-4 w-4 text-gold-600 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-2 py-2 bg-base/60 border-t border-gold-500/20">
          {children}
        </div>
      )}
    </div>
  );
}

function ClassCard({ cls, onNameChange, onDelete, onAddModifier, onUpdateModifier, onRemoveModifier }: {
  cls: RulesetClass;
  onNameChange: (name: string) => void;
  onDelete: () => void;
  onAddModifier: () => void;
  onUpdateModifier: (i: number, patch: Partial<RulesetClassModifier>) => void;
  onRemoveModifier: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gold-500/20 rounded-lg overflow-hidden">
      {/* Class header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface">
        <div
          className="flex-1 flex items-center gap-2 cursor-pointer"
          onClick={() => setOpen(v => !v)}
        >
          <ChevronDown className={`h-3.5 w-3.5 text-gold-600 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
          <input
            className="bg-transparent border-none outline-none text-gold-300 text-sm font-medium flex-1 cursor-text"
            value={cls.name}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Class name…"
          />
        </div>
        {cls.modifiers.length > 0 && !open && (
          <span className="text-gold-700 text-[10px] shrink-0">
            {cls.modifiers.filter(m => m.name).map(m => `${m.name} ${m.value >= 0 ? "+" : ""}${m.value}`).join(" · ")}
          </span>
        )}
        <button
          className="w-6! h-6! min-w-0! p-0! shrink-0 text-[#ef4444]! border-[#ef4444]/30! hover:bg-[#ef4444]/10!"
          onClick={onDelete}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Modifiers */}
      {open && (
        <div className="px-3 py-3 bg-base/60 border-t border-gold-500/20 flex flex-col gap-2">
          {cls.modifiers.length === 0 && (
            <p className="text-gold-700 text-xs">No modifiers yet.</p>
          )}
          {cls.modifiers.map((mod, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="field-input flex-1 min-w-0 text-xs"
                placeholder="Stat name (e.g. STR)"
                value={mod.name}
                onChange={(e) => onUpdateModifier(i, { name: e.target.value })}
              />
              <input
                type="number"
                className="field-input text-center text-xs shrink-0"
                style={{ width: "4rem" }}
                value={mod.value}
                onChange={(e) => onUpdateModifier(i, { value: parseInt(e.target.value) || 0 })}
              />
              <button
                className="w-6! h-6! min-w-0! p-0! shrink-0 text-[#ef4444]! border-[#ef4444]/30! hover:bg-[#ef4444]/10!"
                onClick={() => onRemoveModifier(i)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            className="self-start h-7! min-w-0! px-2! text-[11px]! gap-1! flex items-center"
            onClick={onAddModifier}
          >
            <Plus className="h-3 w-3" /> Add modifier
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ stat, onUpdate, onRemove, isDragging, onDragStart, onDragEnd, onDragOver }: {
  stat: StatDefinition;
  onUpdate: (patch: Partial<StatDefinition>) => void;
  onRemove: () => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
}) {
  return (
    <div
      className="flex items-center gap-2"
      onDragOver={onDragOver}
      onDrop={(e) => e.preventDefault()}
    >
      <div
        draggable
        className={`cursor-grab active:cursor-grabbing text-gold-700 hover:text-gold-500 transition-colors shrink-0 py-1 ${isDragging ? "opacity-40" : ""}`}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className={`flex-1 border border-gold-500/20 rounded-lg px-3 py-2.5 flex flex-col gap-0.5 bg-surface/40 transition-opacity ${isDragging ? "opacity-40" : ""}`}>
        <input
          className="bg-transparent outline-none border-0 text-gold-300 text-sm font-medium leading-snug w-full p-0 m-0 placeholder:text-gold-700/50"
          value={stat.label}
          onChange={(e) => {
            const label = e.target.value;
            onUpdate({ label, key: label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") });
          }}
          placeholder="Write the stat name here…"
        />
        <textarea
          className="bg-transparent outline-none border-0 text-gold-600 text-[11px] w-full resize-none leading-relaxed p-0 m-0 overflow-hidden placeholder:text-gold-700/40"
          style={{ fieldSizing: "content" } as React.CSSProperties}
          value={stat.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Write the stat description here…"
          rows={1}
        />
      </div>

      <button
        className="w-6! h-6! min-w-0! p-0! shrink-0 bg-transparent! text-[#ef4444]! border-[#ef4444]/30! hover:bg-[#ef4444]/10!"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

