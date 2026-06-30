import { useState } from "react";
import type { LayoutNode, TabsSettings, TabPaneSettings } from "../../../../../pages/sheet-editor/types";

export function TabsNode({ node, renderNode }: {
  node: LayoutNode;
  renderNode: (child: LayoutNode) => React.ReactNode;
}) {
  const { width } = node.settings as TabsSettings;
  const [activeIdx, setActiveIdx] = useState(0);

  if (node.children.length === 0) return null;

  const safeIdx = Math.min(activeIdx, node.children.length - 1);
  const activePane = node.children[safeIdx];
  const { padding, gap, direction } = activePane.settings as TabPaneSettings;

  return (
    <div className="border border-gold-500/20 rounded-md overflow-hidden" style={{ ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}>
      {/* Tab bar */}
      <div className="flex border-b border-gold-500/20">
        {node.children.map((child, i) => {
          const label = (child.settings as TabPaneSettings).label || `Tab ${i + 1}`;
          const active = i === safeIdx;
          return (
            <button
              key={child.id}
              type="button"
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors border-y-0 border-x-0 rounded-none border-r border-gold-500/20 last:border-r-0 ${
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
        <div className="flex-1" />
      </div>

      {/* Active pane */}
      <div
        style={{
          display: "flex",
          flexDirection: direction === "horizontal" ? "row" : "column",
          flexWrap: direction === "horizontal" ? "wrap" : "nowrap",
          padding,
          gap,
        }}
      >
        {activePane.children.map((child) => renderNode(child))}
      </div>
    </div>
  );
}
