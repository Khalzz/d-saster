import type { TabPaneSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function TabPanePreview({ node, renderChildren }: NodePreviewProps) {
  const { padding, gap, direction } = node.settings as TabPaneSettings;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        padding,
        gap,
      }}
    >
      {node.children.length === 0 ? (
        <div className="flex items-center justify-center py-3">
          <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
            Empty tab pane
          </span>
        </div>
      ) : (
        renderChildren(node.children)
      )}
    </div>
  );
}
