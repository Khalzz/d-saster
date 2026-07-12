import { useState } from "react";
import { Plus } from "lucide-react";
import type { TabsSettings, TabPaneSettings } from "../../../types";
import type { NodePreviewProps } from "../types";
import { TabBar } from "../../../../../components/ui/tabs/TabBar";

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
        <TabBar
          tabs={node.children.map((child, i) => ({
            id: child.id,
            label: (child.settings as TabPaneSettings).label || `Tab ${i + 1}`,
          }))}
          activeId={pane?.id ?? null}
          onSelect={(id) => setActiveIdx(node.children.findIndex(c => c.id === id))}
          emptyMessage="No tabs"
          onWrapperClick={(e) => e.stopPropagation()}
        />

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
