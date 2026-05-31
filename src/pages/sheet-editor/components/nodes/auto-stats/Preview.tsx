import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AutoStatsSettings } from "../../../types";
import type { NodePreviewProps } from "../types";
import type { Ruleset, StatDefinition } from "../../../../ruleset/ruleset-editor";

export function AutoStatsPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { columns, padding, gap, width, statKeys } = node.settings as AutoStatsSettings;
  const isSelected = selectedIds.has(node.id);
  const [stats, setStats] = useState<StatDefinition[]>([]);

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
        setStats(allStats);
      })
      .catch(() => {});
  }, []);

  const displayStats = statKeys && statKeys.length > 0
    ? stats.filter(s => statKeys.includes(s.key))
    : stats;

  return (
    <div
      className={`transition-colors cursor-pointer ${
        isSelected ? "outline-1 outline-offset-4 outline-gold-400" : ""
      }`}
      style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: '100%' }) }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}
      >
        {displayStats.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-3">
            <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
              No stats in ruleset
            </span>
          </div>
        ) : (
          displayStats.map((stat) => (
            <div
              key={stat.key}
              className="flex flex-col items-center gap-0.5 border border-gold-500/20 rounded-lg pt-2 pb-1.5 px-1 select-none"
            >
              <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider truncate w-full text-center">
                {stat.label.slice(0, 3).toUpperCase()}
              </span>
              <span className="text-xl font-light leading-tight text-gold-300">
                +0
              </span>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value="10"
                className="w-full text-center outline-none text-gold-600 text-[11px] font-medium rounded-md px-0.5 bg-base hover:bg-gold-500/10 transition-colors"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
