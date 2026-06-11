import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Copy, MoreVertical, Trash2 } from "lucide-react";
import type { RulesetSkill, StatDefinition } from "../../../../../pages/ruleset/ruleset-editor";

export function SkillCard({ skill, stats, onUpdate, onDelete, onDuplicate, focusOnMount = false }: {
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
          onChange={e => onUpdate({ name: e.target.value })}
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
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Describe this skill…"
              rows={1}
            />
          </div>
        </div>
      </div>

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
