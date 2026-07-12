import type { LayoutNode, TabsSettings, TabPaneSettings } from "../../../../../pages/sheet-editor/types";
import { Tabs } from "../../../tabs/Tabs";

export function TabsNode({ node, renderNode }: {
  node: LayoutNode;
  renderNode: (child: LayoutNode) => React.ReactNode;
}) {
  const { width } = node.settings as TabsSettings;

  if (node.children.length === 0) return null;

  return (
    <div className="border border-gold-500/20 rounded-md overflow-hidden" style={{ ...(width > 0 ? { width: `${width}%` } : { width: "100%" }) }}>
      <Tabs
        tabs={node.children.map((child, i) => {
          const { label, padding, gap, direction } = child.settings as TabPaneSettings;
          return {
            id: child.id,
            label: label || `Tab ${i + 1}`,
            content: (
              <div
                style={{
                  display: "flex",
                  flexDirection: direction === "horizontal" ? "row" : "column",
                  flexWrap: direction === "horizontal" ? "wrap" : "nowrap",
                  padding,
                  gap,
                }}
              >
                {child.children.map((c) => renderNode(c))}
              </div>
            ),
          };
        })}
      />
    </div>
  );
}
