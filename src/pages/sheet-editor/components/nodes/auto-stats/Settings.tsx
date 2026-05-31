import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { NumberField } from "../shared";
import Field from "../../../../../components/ui/Field";
import type { AutoStatsSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";
import type { Ruleset, StatDefinition } from "../../../../ruleset/ruleset-editor";

export function AutoStatsSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as AutoStatsSettings;
  const [allStats, setAllStats] = useState<StatDefinition[]>([]);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    invoke<Ruleset[]>("list_rulesets")
      .then((rulesets) => {
        const stats: StatDefinition[] = [];
        for (const rs of rulesets) {
          for (const stat of rs.stats) {
            if (!stats.some((x) => x.key === stat.key)) stats.push(stat);
          }
        }
        setAllStats(stats);
      })
      .catch(() => {});
  }, []);

  const isAll = !s.statKeys || s.statKeys.length === 0;

  const toggleStat = (key: string) => {
    if (isAll) {
      // Switching from "all" to manual: select all except this one
      onChange({ statKeys: allStats.filter(st => st.key !== key).map(st => st.key) });
    } else {
      const has = s.statKeys.includes(key);
      const next = has ? s.statKeys.filter(k => k !== key) : [...s.statKeys, key];
      // If selecting all back, reset to empty (meaning "all")
      if (next.length === allStats.length) {
        onChange({ statKeys: [] });
      } else {
        onChange({ statKeys: next });
      }
    }
  };

  const openDropdown = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(v => !v);
  };

  const label = isAll
    ? "All stats"
    : s.statKeys.map(k => {
        const d = allStats.find(st => st.key === k);
        return d ? d.label.slice(0, 3).toUpperCase() : k;
      }).join(", ");

  return (
    <>
      <div className="mb-3">
        <Field label="Stats">
          <div
            ref={triggerRef}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 border border-gold-500/20 bg-base transition-colors cursor-pointer hover:border-gold-500/40"
            onClick={openDropdown}
          >
            <div className="flex-1 min-w-0">
              <p className="text-gold-200 text-xs font-medium truncate">{label}</p>
            </div>
            <ChevronDown className={`h-3 w-3 text-gold-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
          </div>

          {open && dropdownPos && createPortal(
            <>
              <div className="fixed inset-0 z-998" onClick={() => setOpen(false)} />
              <div
                style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 999 }}
                className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl max-h-72 flex flex-col"
              >
                <div className="overflow-y-auto flex-1">
                  {/* All option */}
                  <div
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gold-500/10 transition-colors ${isAll ? "bg-gold-500/15" : ""}`}
                    onClick={() => { onChange({ statKeys: [] }); }}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isAll ? "bg-gold-500 border-gold-500" : "border-gold-500/40"}`}>
                      {isAll && <Check className="h-3 w-3 text-gray-900" />}
                    </div>
                    <p className="text-gold-300 text-xs font-medium">All</p>
                  </div>
                  <div className="border-t border-gold-500/20" />
                  {/* Individual stats */}
                  {allStats.map((stat) => {
                    const selected = isAll || s.statKeys.includes(stat.key);
                    return (
                      <div
                        key={stat.key}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gold-500/10 transition-colors ${selected && !isAll ? "bg-gold-500/15" : ""}`}
                        onClick={() => toggleStat(stat.key)}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-gold-500 border-gold-500" : "border-gold-500/40"}`}>
                          {selected && <Check className="h-3 w-3 text-gray-900" />}
                        </div>
                        <p className="text-gold-300 text-xs font-medium">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>,
            document.body
          )}
        </Field>
      </div>
      <NumberField
        label="Columns"
        value={s.columns}
        onChange={(v) => onChange({ columns: v })}
        min={1}
        max={6}
      />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <NumberField
          label="Padding"
          value={s.padding}
          onChange={(v) => onChange({ padding: v })}
          suffix="px"
        />
        <NumberField
          label="Gap"
          value={s.gap}
          onChange={(v) => onChange({ gap: v })}
          suffix="px"
        />
      </div>
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
