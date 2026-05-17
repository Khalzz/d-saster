import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import Card from "../../../components/ui/card/card";
import Field from "../../../components/ui/Field";
import type { Character, CharacterClass, ClassModifier } from "../character-editor";
import type { Ruleset } from "../../ruleset/ruleset-editor";

interface Props {
  char: Character;
  selectedRuleset: Ruleset | undefined;
  activeClasses: CharacterClass[];
  onChange: (updates: Partial<Character>) => void;
  onClassCreated: (cls: CharacterClass) => void;
  onClassDeleted: (id: string) => void;
}

export function CharacterSettingsCard({ char, selectedRuleset, activeClasses, onChange, onClassCreated, onClassDeleted }: Props) {
  const navigate = useNavigate();
  const classTriggerRef = useRef<HTMLDivElement>(null);
  const [classDropdownPos, setClassDropdownPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassModifiers, setNewClassModifiers] = useState<ClassModifier[]>([]);

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
        <Field label="Name">
          <input
            className="field-input"
            value={char.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Character name"
          />
        </Field>
        <div className="flex gap-3">
          <Field label="Race" className="flex-1">
            <input
              className="field-input"
              value={char.race}
              onChange={(e) => onChange({ race: e.target.value })}
              placeholder="Human, Elf, Dwarf…"
            />
          </Field>
          <Field label="Origin" className="flex-1">
            <input
              className="field-input"
              value={char.origin}
              onChange={(e) => onChange({ origin: e.target.value })}
              placeholder="Acolyte, Soldier…"
            />
          </Field>
        </div>

        <Field label="Class">
          <div
            ref={classTriggerRef}
            className="field-input flex items-start justify-between gap-2 cursor-pointer select-none"
            onClick={() => {
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.currentTarget.click(); }}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${selectedClass ? "text-gold-200" : "text-gold-600"}`}>
                {selectedClass?.name ?? "Select class…"}
              </p>
              {selectedClass?.description && (
                <div className="text-[11px] text-gold-600 mt-0.5 [&>p]:leading-snug [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&_li]:leading-snug [&_li_p]:my-0 [&_strong]:text-gold-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-3 [&_h1]:text-gold-300 [&_h1]:font-bold [&_h2]:text-gold-400 [&_h2]:font-semibold">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{selectedClass.description}</ReactMarkdown>
                </div>
              )}
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-gold-600 transition-transform shrink-0 ${showClassDropdown ? "rotate-180" : ""}`} />
          </div>

          {showClassDropdown && classDropdownPos && createPortal(
            <>
              <div className="fixed inset-0 z-998" onClick={() => setShowClassDropdown(false)} />
              <div
                style={{ position: "fixed", top: classDropdownPos.top, bottom: classDropdownPos.bottom, left: classDropdownPos.left, width: classDropdownPos.width, zIndex: 999 }}
                className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl max-h-36 flex flex-col"
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
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gold-500/10 transition-colors group/cls ${char.classId === cls.id ? "bg-gold-500/15" : ""}`}
                      onClick={() => { onChange({ classId: cls.id }); setShowClassDropdown(false); }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-gold-300 text-xs font-medium truncate">{cls.name}</p>
                        {cls.description && (
                          <div className="text-[10px] text-gold-600 [&>p]:leading-snug [&>p]:mb-1 [&>p:last-child]:mb-0 [&_li]:leading-snug [&_li_p]:my-0 [&_strong]:text-gold-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-3 [&_h1]:text-gold-300 [&_h1]:font-bold [&_h2]:text-gold-400 [&_h2]:font-semibold">
                            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{cls.description}</ReactMarkdown>
                          </div>
                        )}
                        {cls.modifiers.length > 0 && (
                          <p className="text-gold-700 text-[10px] truncate">
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
        </Field>
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
    </>
  );
}
