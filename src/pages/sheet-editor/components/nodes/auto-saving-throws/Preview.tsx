import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Star } from "lucide-react";
import type { AutoSavingThrowsSettings, AutoStatsSettings, LayoutNode } from "../../../types";
import type { NodePreviewProps } from "../types";
import { useSheetTree } from "../../SheetPreview";
import type { Ruleset, StatDefinition } from "../../../../ruleset/ruleset-editor";

export function AutoSavingThrowsPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { columns, padding, gap, width } = node.settings as AutoSavingThrowsSettings;
  const isSelected = selectedIds.has(node.id);
  const tree = useSheetTree();
  const [allStats, setAllStats] = useState<StatDefinition[]>([]);

  useEffect(() => {
    invoke<Ruleset[]>("list_rulesets")
      .then((rulesets) => {
        const stats: StatDefinition[] = [];
        for (const rs of rulesets) {
          for (const stat of rs.stats) {
            if (!stats.some(s => s.key === stat.key)) stats.push(stat);
          }
        }
        setAllStats(stats);
      })
      .catch(() => {});
  }, []);

  // Collect stat keys from auto-stats nodes on the sheet
  const statKeys = useMemo(() => {
    const keys: string[] = [];
    const walk = (nodes: LayoutNode[]) => {
      for (const n of nodes) {
        if (n.type === "auto-stats") {
          const s = n.settings as AutoStatsSettings;
          if (s.statKeys && s.statKeys.length > 0) {
            for (const k of s.statKeys) { if (!keys.includes(k)) keys.push(k); }
          } else {
            // "all" — use all from ruleset
            for (const st of allStats) { if (!keys.includes(st.key)) keys.push(st.key); }
          }
        }
        walk(n.children);
      }
    };
    walk(tree);
    return keys;
  }, [tree, allStats]);

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
        {statKeys.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-3">
            <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
              No stat nodes on sheet
            </span>
          </div>
        ) : (
          statKeys.map((key) => (
            <div
              key={key}
              className="flex flex-col items-center gap-0.5 border border-gold-500/20 rounded-lg px-1.5 py-1.5 select-none"
            >
              <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider w-full text-center h-4 flex justify-center items-center gap-1">
                <Star className="h-3 w-3 text-gold-700 shrink-0" />
                {key.slice(0, 3).toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-gold-300 text-center w-full">
                +0
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
