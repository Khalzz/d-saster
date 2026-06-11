import { createContext, useContext } from "react";
import { LayoutPanelTop } from "lucide-react";
import type { LayoutNode, NodeTypeConfig } from "../types";

// Context providing the full node tree to any preview node that needs it
const SheetTreeContext = createContext<LayoutNode[]>([]);
export function useSheetTree() { return useContext(SheetTreeContext); }

// ── Recursive node renderer (delegates to config) ──────────────────────────
function PreviewNode({
  node,
  selectedIds,
  onSelect,
  onContextMenu,
  nodeTypes,
}: {
  node: LayoutNode;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  nodeTypes: Record<string, NodeTypeConfig>;
}) {
  const config = nodeTypes[node.type];
  if (!config) return null;

  const renderChildren = (children: LayoutNode[]) =>
    children.map((child) => (
      <PreviewNode
        key={child.id}
        node={child}
        selectedIds={selectedIds}
        onSelect={onSelect}
        onContextMenu={onContextMenu}
        nodeTypes={nodeTypes}
      />
    ));

  return (
    <div className="contents" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node.id); }}>
      <config.Preview
        node={node}
        selectedIds={selectedIds}
        onSelect={onSelect}
        renderChildren={renderChildren}
      />
    </div>
  );
}

// ── Main exported component ────────────────────────────────────────────────
interface SheetPreviewProps {
  nodes: LayoutNode[];
  selectedIds: Set<string>;
  onSelect: (id: string | null) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  nodeTypes: Record<string, NodeTypeConfig>;
}

export function SheetPreview({ nodes, selectedIds, onSelect, onContextMenu, nodeTypes }: SheetPreviewProps) {
  return (
    <SheetTreeContext.Provider value={nodes}>
      <div
        className="flex-1  bg-base"
        onClick={() => onSelect(null)}
      >
        <div className="max-w-4xl mx-auto bg-surface border-x h-full border-gold-500/10 overflow-auto">
          <div className="p-6 flex flex-col gap-4 ">
            {nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <LayoutPanelTop className="h-8 w-8 text-gold-700" />
                <p className="text-gold-700 text-xs select-none">
                  Add elements from the hierarchy panel to start building
                </p>
              </div>
            ) : (
              nodes.map((node) => (
                <PreviewNode
                  key={node.id}
                  node={node}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  onContextMenu={onContextMenu}
                  nodeTypes={nodeTypes}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </SheetTreeContext.Provider>
  );
}
