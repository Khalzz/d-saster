import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Rows3,
  Columns3,
  LayoutPanelTop,
  Plus,
  Trash2,
} from "lucide-react";
import type { LayoutNode, NodeType } from "../types";

// ── Icons per node type ────────────────────────────────────────────────────
const NODE_ICONS: Record<NodeType, React.ReactNode> = {
  section: <LayoutPanelTop className="h-3.5 w-3.5" />,
  row:     <Rows3 className="h-3.5 w-3.5" />,
  column:  <Columns3 className="h-3.5 w-3.5" />,
};

const NODE_LABELS: Record<NodeType, string> = {
  section: "Section",
  row:     "Row",
  column:  "Column",
};

// ── Context menu state ─────────────────────────────────────────────────────
interface MenuState {
  nodeId: string | null;
  top?: number;
  bottom?: number;
  left: number;
}

// ── Drop indicator position ────────────────────────────────────────────────
type DropPosition = "before" | "after" | "inside";
interface DropTarget {
  nodeId: string;
  position: DropPosition;
}

// ── Allowed children per node type ─────────────────────────────────────────
const ALLOWED_CHILDREN: Record<NodeType, NodeType[]> = {
  section: ["row", "column", "section"],
  row:     ["column", "section"],
  column:  ["section", "row"],
};

// ── Single tree node row ───────────────────────────────────────────────────
function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onContextMenu,
  expandedIds,
  onToggleExpand,
  dragId,
  dropTarget,
  onPointerDownGrip,
  nodeRefCallback,
}: {
  node: LayoutNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  dragId: string | null;
  dropTarget: DropTarget | null;
  onPointerDownGrip: (e: React.PointerEvent, nodeId: string) => void;
  nodeRefCallback: (el: HTMLDivElement | null, id: string) => void;
}) {
  const isSelected = selectedId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isDragging = dragId === node.id;
  const isDropTarget = dropTarget?.nodeId === node.id;

  const label =
    node.type === "section"
      ? (node.settings as { title?: string }).title || "Section"
      : NODE_LABELS[node.type];

  return (
    <>
      <div
        ref={(el) => nodeRefCallback(el, node.id)}
        data-node-id={node.id}
        className={`relative flex items-center gap-1 px-2 py-1 select-none cursor-pointer transition-colors ${
          isDragging
            ? "opacity-40"
            : isSelected
              ? "bg-gold-500/15 text-gold-300"
              : "text-gold-500 hover:bg-gold-500/8"
        } ${isDropTarget && dropTarget?.position === "inside" ? "ring-1 ring-gold-400/60" : ""} ${isDropTarget && dropTarget?.position === "before" ? "border-t-2 border-t-gold-400" : ""} ${isDropTarget && dropTarget?.position === "after" ? "border-b-2 border-b-gold-400" : ""}`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onPointerDown={(e) => {
          if (e.button === 0) onPointerDownGrip(e, node.id);
        }}
        onClick={() => onSelect(node.id)}
        onContextMenu={(e) => onContextMenu(e, node.id)}
      >
        {/* Expand/collapse toggle */}
        <span
          className={`shrink-0 w-4 h-4 flex items-center justify-center ${
            hasChildren ? "cursor-pointer" : "opacity-0"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            ))}
        </span>

        {/* Icon */}
        <span className="shrink-0 text-gold-600">{NODE_ICONS[node.type]}</span>

        {/* Label */}
        <span className="text-[11px] font-medium truncate flex-1">{label}</span>
      </div>

      {/* Render children if expanded */}
      {isExpanded &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            dragId={dragId}
            dropTarget={dropTarget}
            onPointerDownGrip={onPointerDownGrip}
            nodeRefCallback={nodeRefCallback}
          />
        ))}
    </>
  );
}

// ── Main exported component ────────────────────────────────────────────────
interface HierarchyTreeProps {
  nodes: LayoutNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddChild: (parentId: string | null, type: NodeType) => void;
  onDelete: (id: string) => void;
  onMove: (dragId: string, targetId: string, position: DropPosition) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  canMoveUp: (id: string) => boolean;
  canMoveDown: (id: string) => boolean;
}

export function HierarchyTree({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
  onMove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: HierarchyTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Map node IDs → DOM elements for hit-testing during pointer move
  const nodeEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragging = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const pendingDragId = useRef<string | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const DRAG_THRESHOLD = 5;

  const nodeRefCallback = useCallback(
    (el: HTMLDivElement | null, id: string) => {
      if (el) nodeEls.current.set(id, el);
      else nodeEls.current.delete(id);
    },
    [],
  );

  // ── Pointer-based drag ───────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      startPos.current = { x: e.clientX, y: e.clientY };
      pendingDragId.current = nodeId;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      // Check if we've passed the drag threshold
      if (pendingDragId.current && !dragging.current && startPos.current) {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        if (Math.abs(dx) + Math.abs(dy) >= DRAG_THRESHOLD) {
          dragging.current = true;
          setDragId(pendingDragId.current);
          const style = document.createElement("style");
          style.id = "drag-cursor-override";
          style.textContent = "* { cursor: grabbing !important; }";
          document.head.appendChild(style);

          // Create ghost element
          const sourceEl = nodeEls.current.get(pendingDragId.current!);
          if (sourceEl) {
            const ghost = sourceEl.cloneNode(true) as HTMLDivElement;
            ghost.style.position = "fixed";
            ghost.style.pointerEvents = "none";
            ghost.style.zIndex = "9999";
            ghost.style.width = sourceEl.offsetWidth + "px";
            ghost.style.opacity = "0.85";
            ghost.style.transform = "scale(1.02)";
            ghost.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
            ghost.style.borderRadius = "4px";
            ghost.style.background = "var(--color-surface, #1a1a2e)";
            ghost.style.left = e.clientX - sourceEl.offsetWidth / 2 + "px";
            ghost.style.top = e.clientY - 12 + "px";
            document.body.appendChild(ghost);
            ghostRef.current = ghost;
          }
        }
      }

      if (!dragging.current) return;

      // Move ghost
      if (ghostRef.current) {
        const el = nodeEls.current.get(pendingDragId.current!);
        const w = el ? el.offsetWidth / 2 : 80;
        ghostRef.current.style.left = e.clientX - w + "px";
        ghostRef.current.style.top = e.clientY - 12 + "px";
      }

      // Hit-test: find which node row the pointer is over
      let found: DropTarget | null = null;
      let lowestNode: { id: string; bottom: number } | null = null;

      for (const [id, el] of nodeEls.current) {
        if (id === pendingDragId.current) continue;
        const rect = el.getBoundingClientRect();

        // Track the lowest node for "below all" fallback
        if (!lowestNode || rect.bottom > lowestNode.bottom) {
          lowestNode = { id, bottom: rect.bottom };
        }

        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const y = e.clientY - rect.top;
          const h = rect.height;
          let position: DropPosition;
          if (y < h * 0.25) position = "before";
          else if (y > h * 0.75) position = "after";
          else position = "inside";
          found = { nodeId: id, position };
          break;
        }
      }

      // If pointer is below all nodes, target the last one as "after"
      if (!found && lowestNode && e.clientY > lowestNode.bottom) {
        found = { nodeId: lowestNode.id, position: "after" };
      }

      setDropTarget(found);
    };

    const handleUp = () => {
      if (dragging.current && pendingDragId.current && dropTarget && pendingDragId.current !== dropTarget.nodeId) {
        onMove(pendingDragId.current, dropTarget.nodeId, dropTarget.position);
      }
      dragging.current = false;
      pendingDragId.current = null;
      startPos.current = null;
      setDragId(null);
      setDropTarget(null);
      document.getElementById("drag-cursor-override")?.remove();
      if (ghostRef.current) {
        ghostRef.current.remove();
        ghostRef.current = null;
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dropTarget, onMove]);

  // Close menu on outside click / scroll
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const autoExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const openMenu = (e: React.MouseEvent, nodeId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const menuH = 200;
    const spaceBelow = window.innerHeight - e.clientY;
    if (spaceBelow < menuH && e.clientY > spaceBelow) {
      setMenu({ nodeId, bottom: window.innerHeight - e.clientY, left: e.clientX });
    } else {
      setMenu({ nodeId, top: e.clientY, left: e.clientX });
    }
  };

  const getAddItems = (): { label: string; type: NodeType }[] => {
    if (!menu) return [];
    if (menu.nodeId === null) {
      return [
        { label: "Section", type: "section" },
        { label: "Row", type: "row" },
        { label: "Column", type: "column" },
      ];
    }
    const findType = (nodes: LayoutNode[], id: string): NodeType | null => {
      for (const n of nodes) {
        if (n.id === id) return n.type;
        const f = findType(n.children, id);
        if (f) return f;
      }
      return null;
    };
    const parentType = findType(nodes, menu.nodeId);
    if (!parentType) return [];
    return ALLOWED_CHILDREN[parentType].map((t) => ({
      label: NODE_LABELS[t],
      type: t,
    }));
  };

  const menuNodeId = menu?.nodeId ?? null;
  const showMoveUp = menuNodeId !== null && canMoveUp(menuNodeId);
  const showMoveDown = menuNodeId !== null && canMoveDown(menuNodeId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold-500/20 shrink-0">
        <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">
          Hierarchy
        </span>
        <button
          className="w-6! h-6! min-w-0! p-0! border-0! bg-transparent! text-gold-600! hover:text-gold-400!"
          onClick={(e) => openMenu(e as unknown as React.MouseEvent, null)}
          title="Add root element"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tree body */}
      <div
        className="flex-1 overflow-y-auto py-1"
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) openMenu(e, null);
        }}
      >
        {nodes.length === 0 && (
          <p className="text-gold-700 text-[10px] text-center py-6 px-3 select-none">
            Right-click or press + to add elements
          </p>
        )}
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            onContextMenu={openMenu}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            dragId={dragId}
            dropTarget={dropTarget}
            onPointerDownGrip={handlePointerDown}
            nodeRefCallback={nodeRefCallback}
          />
        ))}
      </div>

      {/* Context menu */}
      {menu &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[998]" onClick={() => setMenu(null)} />
            <div
              style={{
                position: "fixed",
                top: menu.top,
                bottom: menu.bottom,
                left: menu.left,
                width: 172,
                zIndex: 999,
              }}
              className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-xl flex flex-col"
            >
              {/* Add children options */}
              {getAddItems().map((item) => (
                <button
                  key={item.type}
                  className="w-full! h-8! text-[11px]! border-0! outline-none! rounded-none! bg-transparent! text-gold-400! hover:bg-gold-500/10! focus:outline-none! focus:ring-0! flex items-center gap-2 px-3! justify-start!"
                  onClick={() => {
                    const parentId = menu.nodeId;
                    setMenu(null);
                    if (parentId) autoExpand(parentId);
                    onAddChild(parentId, item.type);
                  }}
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  Add {item.label}
                </button>
              ))}

              {/* Move up / down */}
              {menuNodeId && (showMoveUp || showMoveDown) && (
                <>
                  <div className="border-t border-gold-500/10" />
                  {showMoveUp && (
                    <button
                      className="w-full! h-8! text-[11px]! border-0! outline-none! rounded-none! bg-transparent! text-gold-400! hover:bg-gold-500/10! focus:outline-none! focus:ring-0! flex items-center gap-2 px-3! justify-start!"
                      onClick={() => {
                        const id = menuNodeId;
                        setMenu(null);
                        onMoveUp(id);
                      }}
                    >
                      <ChevronUp className="h-3 w-3 shrink-0" />
                      Move Up
                    </button>
                  )}
                  {showMoveDown && (
                    <button
                      className="w-full! h-8! text-[11px]! border-0! outline-none! rounded-none! bg-transparent! text-gold-400! hover:bg-gold-500/10! focus:outline-none! focus:ring-0! flex items-center gap-2 px-3! justify-start!"
                      onClick={() => {
                        const id = menuNodeId;
                        setMenu(null);
                        onMoveDown(id);
                      }}
                    >
                      <ChevronDown className="h-3 w-3 shrink-0" />
                      Move Down
                    </button>
                  )}
                </>
              )}

              {/* Delete */}
              {menuNodeId && (
                <>
                  <div className="border-t border-gold-500/10" />
                  <button
                    className="w-full! h-8! text-[11px]! border-0! outline-none! rounded-none! bg-transparent! text-[#ef4444]! hover:bg-[#ef4444]/10! focus:outline-none! focus:ring-0! flex items-center gap-2 px-3! justify-start!"
                    onClick={() => {
                      const id = menuNodeId;
                      setMenu(null);
                      if (selectedId === id) onSelect(null);
                      onDelete(id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 shrink-0" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
