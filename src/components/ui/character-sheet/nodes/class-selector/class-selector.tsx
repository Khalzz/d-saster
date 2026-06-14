import { useState } from "react";
import { createPortal } from "react-dom";
import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { ClassSelectorSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import { Plus, Search, X } from "lucide-react";
import { CounterInput } from "../count-node/counter-input";

export function ClassSelectorNode({ node, useSheet }: { node: LayoutNode, useSheet: () => SheetContext }) {
  const { label, padding } = node.settings as ClassSelectorSettings;
  const { char, onChange, classes, vars, ruleset } = useSheet();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const maxLevel = ruleset?.maxLevel || 20;
  const totalLevel = Math.floor(Number(vars["level"] ?? char.level ?? 0));

  // All class levels stored in multiclass (including primary). char.classId marks primary.
  const allEntries: { classId: string; level: number }[] = (() => {
    const mc = char.multiclass ?? [];
    const ids = mc.map(m => m.classId);
    if (char.classId && !ids.includes(char.classId)) {
      const derived = Math.max(0, totalLevel - mc.reduce((s, m) => s + m.level, 0));
      return [{ classId: char.classId, level: derived }, ...mc];
    }
    return mc;
  })();

  const allSelectedIds = allEntries.map(e => e.classId);

  const syncLevel = (newTotal: number, extra?: object) => {
    const capped = Math.min(newTotal, maxLevel);
    onChange({ level: capped, customFields: { ...char.customFields, level: capped }, ...extra });
  };

  const setClassLevel = (classId: string, newLvl: number) => {
    const otherTotal = allEntries.filter(e => e.classId !== classId).reduce((s, e) => s + e.level, 0);
    const clamped = Math.max(1, Math.min(newLvl, maxLevel - otherTotal));
    const updated = allEntries.map(e => e.classId === classId ? { ...e, level: clamped } : e);
    const newSum = updated.reduce((s, e) => s + e.level, 0);
    // Total only grows, never shrinks from class level changes
    syncLevel(Math.max(totalLevel, newSum), { multiclass: updated });
  };

  const addClass = (classId: string) => {
    if (totalLevel >= maxLevel) { setModalOpen(false); return; }
    const updated = [...allEntries, { classId, level: 1 }];
    syncLevel(totalLevel + 1, { classId: char.classId ?? classId, multiclass: updated });
    setModalOpen(false);
  };

  const removeClass = (classId: string) => {
    const updated = allEntries.filter(e => e.classId !== classId);
    const newPrimary = classId === char.classId ? (updated[0]?.classId ?? undefined) : char.classId;
    // Removing a class does not reduce total level
    onChange({ classId: newPrimary, multiclass: updated });
  };

  const availableClasses = (ruleset?.classes ?? classes.map(c => ({
    id: c.id, name: c.name, description: c.description ?? "", hitDie: "", primaryAbility: "",
    savingThrowProficiencies: [] as string[], image: undefined as string | undefined, color: undefined as string | undefined,
  }))).filter(c => !allSelectedIds.includes(c.id));

  const selectedClasses = classes.filter(c => allSelectedIds.includes(c.id));

  return (
    <div className="w-full" style={{ padding }}>
      <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
        {label || "Class"}
      </span>

      <div className="flex flex-wrap gap-1.5 mt-1">
        {selectedClasses.map(cls => {
          const entry = allEntries.find(e => e.classId === cls.id);
          const level = entry?.level ?? 0;

          return (
            <div key={cls.id} className="flex items-center p-0 ring-1 ring-gold-500/20 rounded-md overflow-hidden">
              <button
                className="p-0! border-0! bg-transparent! text-gold-700! hover:text-red-400! hover:bg-red-500/10! px-1.5! self-stretch rounded-none!"
                onClick={() => removeClass(cls.id)}
              >
                <X className="h-3 w-3" />
              </button>
              <div className="w-px self-stretch bg-gold-500/20" />
              <span className="text-[10px] text-gold-300 font-medium whitespace-nowrap px-2">{cls.name}</span>
              <CounterInput
                value={level}
                onChange={v => setClassLevel(cls.id, v)}
                min={1}
                max={maxLevel - allEntries.filter(e => e.classId !== cls.id).reduce((s, e) => s + e.level, 0)}
                suffix="lv"
                className=" border-l! border-r-0! border-y-0! border-gold-500/20! rounded-none! h-full!"
                inputClassName=""
              />
            </div>
          );
        })}

        {availableClasses.length > 0 && (
          <button
            className="px-2! border-gold-500/20! text-gold-600! hover:text-gold-400! hover:bg-gold-500/5! text-[10px]!"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {modalOpen && createPortal(
        <>
          <div className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm" onClick={() => { setModalOpen(false); setSearch(""); }} />
          <div className="fixed inset-0 z-101 flex items-center justify-center p-6 pointer-events-none">
            <div className="bg-surface border border-gold-500/20 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col pointer-events-auto shadow-2xl relative">
              <div className="absolute -top-3 left-5">
                <span className="bg-surface border border-gold-500/20 rounded-md px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold-500/60 select-none">
                  Select Class
                </span>
              </div>
              <div className="px-4 pt-5 shrink-0 flex items-center gap-2">
                <Search className="h-3 w-3 text-gold-600 shrink-0" />
                <input
                  autoFocus
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-gold-300 placeholder:text-gold-700 p-0"
                  placeholder="Search classes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="h-px bg-gold-500/15 shrink-0 mx-4" />
              <div className="overflow-y-auto p-4 grid grid-cols-3 gap-3">
                {availableClasses.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(cls => {
                  const firstSentence = cls.description?.split(/\.\s/)[0]?.trim() ?? "";
                  const desc = firstSentence ? (firstSentence.endsWith(".") ? firstSentence : firstSentence + ".") : "";
                  return (
                    <button
                      key={cls.id}
                      className="flex flex-col text-left border-gold-500/20! rounded-lg! bg-transparent! hover:border-gold-500/40! transition-colors h-auto! p-0! overflow-hidden"
                      onClick={() => { addClass(cls.id); setSearch(""); }}
                    >
                      <div className="w-full h-20 relative shrink-0" style={{ background: cls.color ?? "#1a2d1f" }}>
                        {cls.image && <img src={cls.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                      </div>
                      <div className="flex flex-col gap-1.5 p-3">
                        <span className="text-gold-300 font-semibold text-xs">{cls.name || <span className="italic text-gold-600">Unnamed</span>}</span>
                        {desc && <p className="text-[10px] text-gold-600 leading-relaxed">{desc}</p>}
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {cls.primaryAbility && (
                            <span className="text-[9px] text-gold-500 border border-gold-500/20 rounded px-1.5 py-0.5 uppercase tracking-wider">{cls.primaryAbility}</span>
                          )}
                          {cls.hitDie && (
                            <span className="text-[9px] text-gold-600 border border-gold-500/20 rounded px-1.5 py-0.5 font-mono">{cls.hitDie}</span>
                          )}
                          {(cls.savingThrowProficiencies ?? []).map((s: string) => (
                            <span key={s} className="text-[9px] text-gold-700 border border-gold-500/15 rounded px-1.5 py-0.5 uppercase tracking-wider">{s}</span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {availableClasses.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <p className="col-span-3 text-center text-gold-700 text-xs py-6">No classes found</p>
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
