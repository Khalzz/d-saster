import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Trash2, X } from "lucide-react";
import Modal from "../../../modal/Modal";
import Field from "../../../Field";
import { NumberInput } from "../../../NumberInput";
import type { TraitAssignment, RulesetSpecie, RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";
import { applyTraitFieldValues } from "../../../../../pages/ruleset/ruleset-editor";
import { Markdown } from "../../../Markdown";

const RESISTANCE_SECTIONS = [
  { key: "damageResistances"    as const, label: "Damage Resistances"     },
  { key: "damageImmunities"     as const, label: "Damage Immunities"      },
  { key: "conditionImmunities"  as const, label: "Condition Immunities"   },
  { key: "damageVulnerabilities"as const, label: "Damage Vulnerabilities" },
];

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

  const filtered = availableTraits.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
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

export function SpecieModal({ specie: initial, isNew, availableTraits, onCreateTrait, onSave, onClose }: {
  specie: RulesetSpecie;
  isNew: boolean;
  availableTraits: RulesetSpecieTrait[];
  onCreateTrait: (name: string) => string;
  onSave: (specie: RulesetSpecie) => void;
  onClose: () => void;
}) {
  const [specie, setSpecie] = useState<RulesetSpecie>(initial);
  const patch = (p: Partial<RulesetSpecie>) => setSpecie(s => ({ ...s, ...p }));
  const unitLabel = specie.unit;
  const [traitPickerOpen, setTraitPickerOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [activeSections, setActiveSections] = useState<Set<typeof RESISTANCE_SECTIONS[number]["key"]>>(
    () => new Set(RESISTANCE_SECTIONS.filter(s => initial[s.key].length > 0).map(s => s.key))
  );
  const addSectionBtnRef = useRef<HTMLButtonElement>(null);
  const [sectionPickerPos, setSectionPickerPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const isDirty = JSON.stringify(specie) !== JSON.stringify(initial);
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

        <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
          <h2 className="text-gold-300 font-semibold text-sm flex-1">{isNew ? "New Specie" : "Edit Specie"}</h2>
          <div className="flex gap-1">
            {(["ft", "m"] as const).map(u => (
              <button key={u} type="button"
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-colors ${specie.unit === u ? "border-gold-500 text-gold-400 bg-gold-500/10" : "border-gold-500/20 text-gold-600 hover:border-gold-500/40"}`}
                onClick={() => {
                  if (specie.unit === u) return;
                  const toM = u === "m";
                  patch({
                    unit: u,
                    movements: specie.movements.map(m => ({
                      ...m,
                      value: toM ? Math.round(m.value * 0.3048 * 10) / 10 : Math.round(m.value / 0.3048),
                    })),
                  });
                }}
              >{u}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

          <ModalSection title="Identity">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <input className={inputLineCls} value={specie.name} onChange={e => patch({ name: e.target.value })} placeholder="e.g. Human, Elf, Dwarf…" />
                </Field>
                <Field label="Size">
                  <div
                    ref={sizeTriggerRef}
                    className={`${inputLineCls} flex items-center gap-1.5 flex-wrap cursor-pointer select-none`}
                    onClick={openSizeDropdown}
                  >
                    {specie.size.length ? specie.size.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-full px-2 py-px text-[10px] font-medium bg-gold-500/15 text-gold-300 border border-gold-500/30">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        <span className="text-gold-600">({SIZE_DATA[s]?.[specie.unit]})</span>
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
                          const active = specie.size.includes(s as never);
                          return (
                            <div
                              key={s}
                              className={`px-3 py-2 cursor-pointer text-xs flex items-center gap-2 hover:bg-gold-500/10 transition-colors ${active ? "text-gold-300" : "text-gold-500"}`}
                              onClick={() => patch({ size: active ? specie.size.filter(x => x !== s) : [...specie.size, s] } as Partial<RulesetSpecie>)}
                            >
                              {active ? <Check className="h-3 w-3 shrink-0" /> : <span className="w-3 shrink-0" />}
                              <span className="flex-1">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                              <span className="text-gold-700 text-[10px]">({SIZE_DATA[s][specie.unit]})</span>
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
                  value={specie.description}
                  onChange={e => patch({ description: e.target.value })}
                  placeholder="Describe this specie…"
                />
              </Field>
            </div>
          </ModalSection>

          <ModalSection title="Movement Speeds">
            <div className="flex flex-wrap gap-2">
              {specie.movements.map((mov, i) => (
                <div key={i} className="flex flex-1 basis-40 items-center justify-between gap-2 border border-gold-500/20 rounded-lg p-1 px-2">
                  <input
                    className="flex-1 min-w-0 bg-transparent text-gold-500 text-xs font-bold tracking-wider outline-none placeholder:text-gold-700 caret-gold-500"
                    value={mov.label}
                    onChange={e => patch({ movements: specie.movements.map((m, j) => j === i ? { ...m, label: e.target.value } : m) })}
                    placeholder="Walk, Fly…"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <NumberInput
                      value={mov.value}
                      onChange={v => patch({ movements: specie.movements.map((m, j) => j === i ? { ...m, value: v } : m) })}
                      min={0}
                      suffix={unitLabel}
                      className="w-20"
                    />
                    <button
                      type="button"
                      className="w-6! h-6! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! shrink-0"
                      onClick={() => patch({ movements: specie.movements.filter((_, j) => j !== i) })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border! border-dashed! border-gold-500/20! rounded-lg! text-gold-600! hover:text-gold-400! hover:border-gold-500/40!"
                onClick={() => patch({ movements: [...specie.movements, { label: "", value: 0 }] })}
              >
                <Plus className="h-3 w-3" /> Add Movement
              </button>
            </div>
          </ModalSection>

          <ModalSection title="Traits">
            <div className="flex flex-col gap-2">
              {specie.traitAssignments.length > 0 && (
                <div className="flex flex-col gap-2">
                  {specie.traitAssignments.map(assignment => {
                    const trait = availableTraits.find(t => t.id === assignment.traitId);
                    if (!trait) return null;
                    const setValues = (values: Record<string, string>) =>
                      patch({ traitAssignments: specie.traitAssignments.map(a => a.traitId === assignment.traitId ? { ...a, values } : a) });
                    return (
                      <div key={assignment.traitId} className="border border-gold-500/20 rounded-lg px-3 py-2 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gold-300 text-xs font-semibold">{trait.name || <span className="italic text-gold-600">Unnamed</span>}</span>
                          <button
                            type="button"
                            className="w-5! h-5! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! shrink-0"
                            onClick={() => patch({ traitAssignments: specie.traitAssignments.filter(a => a.traitId !== assignment.traitId) })}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        {trait.description && (
                          <Markdown className="text-[11px] text-gold-600">
                            {applyTraitFieldValues(trait.description, trait.fields ?? [], assignment.values)}
                          </Markdown>
                        )}
                        {trait.fields.length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {trait.fields.map(field => (
                              <div key={field.id} className="flex items-center gap-1.5">
                                <span className="text-gold-600 text-[11px] shrink-0">{field.label}</span>
                                <input
                                  className="w-20 bg-base border border-gold-500/20 rounded px-1.5 h-6 text-xs text-gold-400 outline-none focus:border-gold-500/40 caret-gold-500"
                                  value={assignment.values[field.id] ?? ""}
                                  placeholder="—"
                                  onChange={e => setValues({ ...assignment.values, [field.id]: e.target.value })}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                selectedIds={specie.traitAssignments.map(a => a.traitId)}
                onToggle={id => {
                  const exists = specie.traitAssignments.some(a => a.traitId === id);
                  patch({ traitAssignments: exists
                    ? specie.traitAssignments.filter(a => a.traitId !== id)
                    : [...specie.traitAssignments, { traitId: id, values: {} } as TraitAssignment]
                  });
                }}
                onCreate={name => {
                  const id = onCreateTrait(name);
                  patch({ traitAssignments: [...specie.traitAssignments, { traitId: id, values: {} }] });
                }}
                onClose={() => setTraitPickerOpen(false)}
              />
            )}
          </ModalSection>

          <ModalSection title="Resistances & Immunities">
            <div className="flex flex-col gap-3">
              {RESISTANCE_SECTIONS.filter(s => activeSections.has(s.key)).map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gold-500 text-[11px] font-semibold">{label}</span>
                    <button
                      type="button"
                      className="w-5! h-5! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! shrink-0"
                      onClick={() => { setActiveSections(s => { const n = new Set(s); n.delete(key); return n; }); patch({ [key]: [] }); }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <TagInput value={specie[key]} onChange={v => patch({ [key]: v })} />
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
                      onClick={() => { setActiveSections(s => new Set([...s, key])); setSectionPickerPos(null); }}
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

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gold-500/20 shrink-0">
          <button className="px-4! h-8! text-xs! border-gold-500/30! text-gold-500!" onClick={handleClose}>Cancel</button>
          <button
            className="px-4! h-8! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
            onClick={() => onSave(specie)}
          >
            {isNew ? "Add Specie" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
