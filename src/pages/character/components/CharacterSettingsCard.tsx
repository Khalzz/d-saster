import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, Minus, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import Card from "../../../components/ui/card/card";
import Field from "../../../components/ui/Field";
import Tooltip from "../../../components/ui/tooltip/Tooltip";
import type { Character, CharacterClass, ClassModifier } from "../character-editor";
import type { Ruleset } from "../../ruleset/ruleset-editor";

interface Props {
  char: Character;
  selectedRuleset: Ruleset | undefined;
  activeClasses: CharacterClass[];
  onChange: (updates: Partial<Character>) => void;
  onClassCreated: (cls: CharacterClass) => void;
  onClassDeleted: (id: string) => void;
  onActiveMulticlassChange?: (idx: number) => void;
}

export function CharacterSettingsCard({ char, selectedRuleset, activeClasses, onChange, onClassCreated, onClassDeleted, onActiveMulticlassChange }: Props) {
  const navigate = useNavigate();
  const classTriggerRef = useRef<HTMLDivElement>(null);
  const [classDropdownPos, setClassDropdownPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassModifiers, setNewClassModifiers] = useState<ClassModifier[]>([]);
  const [multiclassDropdownIdx, setMulticlassDropdownIdx] = useState<number | null>(null);
  const [multiclassActiveIdx, setMulticlassActiveIdxRaw] = useState(0);
  const setMulticlassActiveIdx = (idx: number) => {
    setMulticlassActiveIdxRaw(idx);
    onActiveMulticlassChange?.(idx);
  };
  const multiclassTriggerRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const [multiclassDropdownPos, setMulticlassDropdownPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  const isMulticlass = !!char.multiclass;
  const selectedClass = activeClasses.find(c => c.id === char.classId);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) { toast.error("Class name is required"); return; }
    const newClass: CharacterClass = {
      id: crypto.randomUUID(),
      name: newClassName.trim(),
      modifiers: newClassModifiers.filter(m => m.name.trim()),
    };
    await invoke("save_class", { class: newClass }).catch(() => {});
    onClassCreated(newClass);
    onChange({ classId: newClass.id });
    setShowCreateClass(false);
    setNewClassName("");
    setNewClassModifiers([]);
  };

  const deleteClass = async (id: string) => {
    await invoke("delete_class", { id }).catch(() => {});
    onClassDeleted(id);
    if (char.classId === id) onChange({ classId: undefined });
  };

  return (
    <>
      <Card className="h-fit bg-transparent" title="Character settings">
        <div className="flex gap-3 items-end">
          <Field label="Name" className="flex-1">
            <input
              className=" "
              value={char.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Character name"
            />
          </Field>
          {(() => {
            const max = selectedRuleset?.maxLevel ?? 20;
            const set = (n: number) => onChange({ level: Math.max(0, Math.min(max, n)) });
            return (
              <Field label={<>LEVEL <span className="text-gold-700 text-[9px] font-normal normal-case tracking-normal">{isMulticlass ? "(multiclass)" : `(${max} max)`}</span></>} className="shrink-0">
                <div className="flex w-fit rounded-lg overflow-hidden border border-gold-500/20 h-10">
                  <button
                    type="button"
                    className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
                    onClick={() => !isMulticlass && set(char.level - 1)}
                    disabled={isMulticlass}
                  ><Minus className="h-3 w-3" /></button>
                  <div className="w-px bg-gold-500/20 shrink-0" />
                  <input
                    type="number"
                    className="w-10 h-full text-sm font-light text-gold-300 text-center bg-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={char.level}
                    min={0}
                    max={max}
                    readOnly={isMulticlass}
                    onChange={(e) => !isMulticlass && set(parseInt(e.target.value) || 0)}
                  />
                  <div className="w-px bg-gold-500/20 shrink-0" />
                  <button
                    type="button"
                    className="w-6! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
                    onClick={() => !isMulticlass && set(char.level + 1)}
                    disabled={isMulticlass}
                  ><Plus className="h-3 w-3" /></button>
                </div>
              </Field>
            );
          })()}
        </div>
        <div className="flex gap-3">
          <Field label="Race" className="flex-1">
            <input
              className=" "
              value={char.race}
              onChange={(e) => onChange({ race: e.target.value })}
              placeholder="Human, Elf, Dwarf…"
            />
          </Field>
          <Field label="Origin" className="flex-1">
            <input
              className=" "
              value={char.origin}
              onChange={(e) => onChange({ origin: e.target.value })}
              placeholder="Acolyte, Soldier…"
            />
          </Field>
        </div>

        {/* Class section as its own card-like area */}
        <div className="flex flex-col rounded-lg border border-gold-500/20 mt-2">
          <div className="flex items-center justify-between px-2 pt-0.5">
            <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">Class</span>
            <Tooltip text="A multiclass character gains levels in multiple classes, combining their features and abilities.">
              <div className="flex items-center gap-1.5">
                <span className="text-gold-600 text-[9px] uppercase tracking-wider">Multiclass</span>
                <button
                  type="button"
                  className={`relative w-7! min-w-0! h-4! rounded-full! border-0! p-0! transition-colors cursor-pointer ${isMulticlass ? "bg-gold-500!" : "bg-gold-500/20!"}`}
                  onClick={() => {
                    if (!isMulticlass) {
                      const first = char.classId ? { classId: char.classId, level: char.level } : { classId: "", level: 1 };
                      onChange({ classId: undefined, multiclass: [first], level: first.level });
                    } else {
                      const first = char.multiclass?.[0];
                      onChange({ multiclass: undefined, classId: first?.classId || undefined, level: first?.level || 1 });
                    }
                  }}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isMulticlass ? "left-3.5 bg-base" : "left-0.5 bg-gold-700"}`} />
                </button>
              </div>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-1.5 px-2 pb-2">
            {!isMulticlass ? (
              /* Single class row */
              <div className="flex items-center gap-2">
                <div
                  ref={classTriggerRef}
                  className="flex-1 flex items-center gap-2 rounded-md px-2.5 py-2 border border-gold-500/20 bg-base transition-colors cursor-pointer hover:border-gold-500/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${selectedClass ? "text-gold-200" : "text-gold-600"}`}>
                      {selectedClass?.name ?? "No class selected"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-6! h-6! min-w-0! p-0! shrink-0 rounded! border-gold-500/30! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (classTriggerRef.current) {
                        const r = classTriggerRef.current.getBoundingClientRect();
                        const spaceBelow = window.innerHeight - r.bottom;
                        if (spaceBelow < 160 && r.top > spaceBelow) {
                          setClassDropdownPos({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width });
                        } else {
                          setClassDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
                        }
                      }
                      setShowClassDropdown(v => !v);
                    }}
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform ${showClassDropdown ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {showClassDropdown && classDropdownPos && createPortal(
                  <>
                    <div className="fixed inset-0 z-998" onClick={() => setShowClassDropdown(false)} />
                    <div
                      style={{ position: "fixed", top: classDropdownPos.top, bottom: classDropdownPos.bottom, left: classDropdownPos.left, width: classDropdownPos.width, zIndex: 999 }}
                      className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl max-h-72 flex flex-col"
                    >
                      <div className="overflow-y-auto flex-1">
                        {activeClasses.length === 0 && (
                          <p className="text-gold-700 text-xs px-3 py-2.5">
                            {selectedRuleset ? "No classes defined in this ruleset" : "No classes yet"}
                          </p>
                        )}
                        {activeClasses.map(cls => (
                          <div
                            key={cls.id}
                            className={`flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gold-500/10 transition-colors group/cls ${char.classId === cls.id ? "bg-gold-500/15" : ""}`}
                            onClick={() => { onChange({ classId: cls.id }); setShowClassDropdown(false); }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-gold-300 text-xs font-medium truncate">{cls.name}</p>
                              {cls.description && (
                                <div className="text-[10px] text-gold-600 mt-0.5 [&>p]:leading-snug [&>p]:mb-1 [&>p:last-child]:mb-0 [&_strong]:text-gold-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-3">
                                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{cls.description}</ReactMarkdown>
                                </div>
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
                      </div>
                      {!selectedRuleset && (
                        <div className="border-t border-gold-500/20 shrink-0">
                          <button
                            className="w-full! h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 text-gold-500! hover:bg-gold-500/10! bg-transparent!"
                            onClick={() => { setShowClassDropdown(false); setShowCreateClass(true); }}
                          >
                            <Plus className="h-3.5 w-3.5" /> Create class
                          </button>
                        </div>
                      )}
                      {selectedRuleset && (
                        <div className="border-t border-gold-500/20 shrink-0">
                          <button
                            className="w-full! h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 text-gold-600! hover:bg-gold-500/10! bg-transparent!"
                            onClick={() => { setShowClassDropdown(false); navigate("/ruleset-editor", { state: { existing: selectedRuleset } }); }}
                          >
                            Edit in ruleset
                          </button>
                        </div>
                      )}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            ) : (
              /* Multiclass rows */
              <div className="flex flex-col gap-1.5">
                {char.multiclass!.map((mc, idx) => {
                  const mcClass = activeClasses.find(c => c.id === mc.classId);
                  const max = selectedRuleset?.maxLevel ?? 20;
                  const isActive = multiclassActiveIdx === idx;
                  const usedClassIds = char.multiclass!.filter((_, i) => i !== idx).map(m => m.classId).filter(Boolean);
                  const availableClasses = activeClasses.filter(c => !usedClassIds.includes(c.id));
                  const setMcLevel = (n: number) => {
                    const updated = char.multiclass!.map((m, i) => i === idx ? { ...m, level: Math.max(1, Math.min(max, n)) } : m);
                    const totalLevel = updated.reduce((s, m) => s + m.level, 0);
                    onChange({ multiclass: updated, level: totalLevel });
                  };
                  const setMcClass = (classId: string) => {
                    const updated = char.multiclass!.map((m, i) => i === idx ? { ...m, classId } : m);
                    onChange({ multiclass: updated });
                    setMulticlassDropdownIdx(null);
                  };
                  const removeSlot = () => {
                    if (char.multiclass!.length <= 1) {
                      const remaining = char.multiclass![0];
                      onChange({ multiclass: undefined, classId: remaining.classId || undefined, level: remaining.level });
                    } else {
                      const updated = char.multiclass!.filter((_, i) => i !== idx);
                      const totalLevel = updated.reduce((s, m) => s + m.level, 0);
                      onChange({ multiclass: updated, level: totalLevel });
                      if (multiclassActiveIdx >= updated.length) setMulticlassActiveIdx(updated.length - 1);
                    }
                  };
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        ref={(el) => { multiclassTriggerRefs.current[idx] = el; }}
                        className={`flex-1 flex items-center gap-2 rounded-md px-2.5 py-2 border transition-colors cursor-pointer ${isActive ? "border-gold-400 bg-gold-500/10" : "border-gold-500/20 bg-base hover:border-gold-500/40"}`}
                        onClick={() => setMulticlassActiveIdx(idx)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${mcClass ? "text-gold-200" : "text-gold-600"}`}>
                            {mcClass?.name ?? "Select class…"}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="w-6! h-6! min-w-0! p-0! shrink-0 rounded! border-gold-500/30! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMulticlassActiveIdx(idx);
                            const el = multiclassTriggerRefs.current[idx];
                            if (el) {
                              const r = el.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - r.bottom;
                              if (spaceBelow < 160 && r.top > spaceBelow) {
                                setMulticlassDropdownPos({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width });
                              } else {
                                setMulticlassDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
                              }
                            }
                            setMulticlassDropdownIdx(prev => prev === idx ? null : idx);
                          }}
                        >
                          <ChevronDown className={`h-3 w-3 transition-transform ${multiclassDropdownIdx === idx ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {/* Level stepper */}
                      <div className="flex rounded-md overflow-hidden border border-gold-500/20 h-8 shrink-0">
                        <button
                          type="button"
                          className="w-5! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
                          onClick={() => setMcLevel(mc.level - 1)}
                        ><Minus className="h-2.5 w-2.5" /></button>
                        <div className="w-px bg-gold-500/20 shrink-0" />
                        <input
                          type="number"
                          className="w-7 h-full text-xs font-semibold text-gold-300 text-center bg-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={mc.level}
                          min={1}
                          max={max}
                          onChange={(e) => setMcLevel(parseInt(e.target.value) || 1)}
                        />
                        <div className="w-px bg-gold-500/20 shrink-0" />
                        <button
                          type="button"
                          className="w-5! min-w-0! h-full! border-0! rounded-none! bg-transparent! text-gold-500! hover:bg-gold-500/10! flex items-center justify-center shrink-0"
                          onClick={() => setMcLevel(mc.level + 1)}
                        ><Plus className="h-2.5 w-2.5" /></button>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        className="w-5! h-5! min-w-0! p-0! shrink-0 rounded-full! border-0! bg-transparent! text-gold-700! hover:text-[#ef4444]! flex items-center justify-center"
                        title="Remove class"
                        onClick={removeSlot}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      {/* Dropdown for this slot */}
                      {multiclassDropdownIdx === idx && multiclassDropdownPos && createPortal(
                        <>
                          <div className="fixed inset-0 z-998" onClick={() => setMulticlassDropdownIdx(null)} />
                          <div
                            style={{ position: "fixed", top: multiclassDropdownPos.top, bottom: multiclassDropdownPos.bottom, left: multiclassDropdownPos.left, width: multiclassDropdownPos.width, zIndex: 999 }}
                            className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl max-h-72 flex flex-col"
                          >
                            <div className="overflow-y-auto flex-1">
                              {availableClasses.length === 0 && (
                                <p className="text-gold-700 text-xs px-3 py-2.5">No available classes</p>
                              )}
                              {availableClasses.map(cls => (
                                <div
                                  key={cls.id}
                                  className={`flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gold-500/10 transition-colors ${mc.classId === cls.id ? "bg-gold-500/15" : ""}`}
                                  onClick={(e) => { e.stopPropagation(); setMcClass(cls.id); }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-gold-300 text-xs font-medium truncate">{cls.name}</p>
                                    {cls.description && (
                                      <div className="text-[10px] text-gold-600 mt-0.5 [&>p]:leading-snug [&>p]:mb-1 [&>p:last-child]:mb-0 [&_strong]:text-gold-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-3">
                                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>{cls.description}</ReactMarkdown>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {!selectedRuleset && (
                              <div className="border-t border-gold-500/20 shrink-0">
                                <button
                                  className="w-full! h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 text-gold-500! hover:bg-gold-500/10! bg-transparent!"
                                  onClick={() => { setMulticlassDropdownIdx(null); setShowCreateClass(true); }}
                                >
                                  <Plus className="h-3.5 w-3.5" /> Create class
                                </button>
                              </div>
                            )}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add class button at bottom */}
          {isMulticlass && (
            <div className="border-t border-gold-500/10">
              <button
                className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border-0! rounded-none! text-gold-600! hover:text-gold-400! hover:bg-gold-500/5!"
                onClick={() => {
                  const updated = [...char.multiclass!, { classId: "", level: 1 }];
                  const totalLevel = updated.reduce((s, m) => s + m.level, 0);
                  onChange({ multiclass: updated, level: totalLevel });
                }}
              >
                <Plus className="h-3 w-3" /> Add Class
              </button>
            </div>
          )}
        </div>
      </Card>

      {showCreateClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowCreateClass(false)}
        >
          <div
            className="bg-surface border border-gold-500/60 rounded-xl p-6 w-96 flex flex-col gap-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gold-400 font-semibold text-sm">Create Class</p>

            <Field label="Class name">
              <input
                autoFocus
                className=" "
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
                      className="  flex-1 min-w-0"
                      placeholder="Name (e.g. STR, AC…)"
                      value={mod.name}
                      onChange={(e) => setNewClassModifiers(prev => prev.map((m, j) => j === i ? { ...m, name: e.target.value } : m))}
                    />
                    <input
                      type="number"
                      className="  text-center shrink-0"
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
    </>
  );
}
