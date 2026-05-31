import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown } from "lucide-react";
import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import type { StatSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";
import type { Ruleset } from "../../../../ruleset/ruleset-editor";
import type { StatDefinition } from "../../../../ruleset/ruleset-editor";

export function StatSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as StatSettings;
  const [statDefs, setStatDefs] = useState<StatDefinition[]>([]);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  useEffect(() => {
    invoke<Ruleset[]>("list_rulesets")
      .then((rulesets) => {
        const allStats: StatDefinition[] = [];
        for (const rs of rulesets) {
          for (const stat of rs.stats) {
            if (!allStats.some((s) => s.key === stat.key)) {
              allStats.push(stat);
            }
          }
        }
        setStatDefs(allStats);
      })
      .catch(() => {});
  }, []);

  const selectedDef = statDefs.find((d) => d.key === s.statKey);

  const openDropdown = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      if (spaceBelow < 160 && r.top > spaceBelow) {
        setDropdownPos({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width });
      } else {
        setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
      }
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <div className="mb-3">
        <Field label="Stat">
          <div
            ref={triggerRef}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 border border-gold-500/20 bg-base transition-colors cursor-pointer hover:border-gold-500/40"
            onClick={openDropdown}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${selectedDef ? "text-gold-200" : "text-gold-600"}`}>
                {selectedDef?.label ?? "Select a stat…"}
              </p>
          </div>
          <div className="w-6 h-6 shrink-0 rounded border border-gold-500/30 bg-transparent flex items-center justify-center">
            <ChevronDown className={`h-3 w-3 text-gold-500 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>

        {open && dropdownPos && createPortal(
          <>
            <div className="fixed inset-0 z-998" onClick={() => setOpen(false)} />
            <div
              style={{ position: "fixed", top: dropdownPos.top, bottom: dropdownPos.bottom, left: dropdownPos.left, width: dropdownPos.width, zIndex: 999 }}
              className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl max-h-72 flex flex-col"
            >
              <div className="overflow-y-auto flex-1">
                {statDefs.length === 0 && (
                  <p className="text-gold-700 text-xs px-3 py-2.5">No stats defined in any ruleset</p>
                )}
                {statDefs.map((def) => (
                  <div
                    key={def.key}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gold-500/10 transition-colors ${s.statKey === def.key ? "bg-gold-500/15" : ""}`}
                    onClick={() => { onChange({ statKey: def.key }); setOpen(false); }}
                  >
                    <p className="text-gold-300 text-xs font-medium truncate">{def.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
        </Field>
      </div>
      <NumberField
        label="Padding"
        value={s.padding}
        onChange={(v) => onChange({ padding: v })}
        suffix="px"
      />
      <div className="mt-3">
        <Field label="Width">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={s.width ? String(s.width) : ""}
              onChange={(e) => {
                const v = e.target.value === "" ? 0 : Math.min(100, Math.max(0, Number(e.target.value) || 0));
                onChange({ width: v });
              }}
              placeholder="Auto"
              className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gold-700 pointer-events-none">%</span>
          </div>
        </Field>
      </div>
    </>
  );
}
