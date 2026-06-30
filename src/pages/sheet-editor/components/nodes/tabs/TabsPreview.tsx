import { useState } from "react";
import { Plus } from "lucide-react";
import type { TabsSettings, TabPaneSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function TabsPreview({ node, selectedIds, onSelect, renderChildren }: NodePreviewProps) {
  const { width } = node.settings as TabsSettings;
  const [activeIdx, setActiveIdx] = useState(0);
  const isSelected = selectedIds.has(node.id);

  const selectedPaneIdx = node.children.findIndex(child => selectedIds.has(child.id));
  const safeIdx = selectedPaneIdx >= 0 ? selectedPaneIdx : Math.min(activeIdx, Math.max(0, node.children.length - 1));
  const pane = node.children[safeIdx];
  const ps = pane ? (pane.settings as TabPaneSettings) : null;

  return (
    <div
      className={`relative transition-colors cursor-pointer ${isSelected ? "outline outline-gold-400/60 rounded-md" : ""}`}
      style={{ ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
    >
      <div className="border border-gold-500/20 rounded-md overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gold-500/20" onClick={(e) => e.stopPropagation()}>
          {node.children.map((child, i) => {
            const label = (child.settings as TabPaneSettings).label || `Tab ${i + 1}`;
            const active = i === safeIdx;
            return (
              <button
                key={child.id}
                type="button"
                className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors border-y-0 border-x-0 rounded-none border-r border-gold-500/20 last:border-r-0 ${
                  active
                    ? "text-gold-300 bg-gold-500/8"
                    : "text-gold-600 hover:text-gold-400 hover:bg-gold-500/5"
                }`}
                onClick={() => setActiveIdx(i)}
              >
                {label}
              </button>
            );
          })}
          {node.children.length === 0 && (
            <span className="text-gold-700 text-[10px] px-3 py-2 italic">No tabs</span>
          )}
          <div className="flex-1" />
        </div>

        {/* Active pane */}
        <div
          style={{
            display: "flex",
            flexDirection: ps?.direction === "horizontal" ? "row" : "column",
            flexWrap: ps?.direction === "horizontal" ? "wrap" : "nowrap",
            padding: ps?.padding ?? 8,
            gap: ps?.gap ?? 8,
          }}
        >
          {!pane ? (
            <div className="flex items-center justify-center py-3">
              <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">No tabs yet</span>
            </div>
          ) : pane.children.length === 0 ? (
            <div className="flex items-center justify-center gap-1.5 py-3">
              <Plus className="h-3 w-3 text-gold-700" />
              <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
                Empty — add nodes to this tab pane
              </span>
            </div>
          ) : (
            renderChildren(pane.children)
          )}
        </div>
      </div>
    </div>
  );
}
