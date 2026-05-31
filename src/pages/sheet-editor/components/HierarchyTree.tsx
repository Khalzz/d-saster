import { useState, useCallback, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  LayoutGrid,
  Puzzle,
  Rows3,
  Columns3,
} from "lucide-react";
import type { LayoutNode, NodeType, NodeTypeConfig } from "../types";
import Modal from "../../../components/ui/modal/Modal";
import SearchBar from "../../../components/ui/searchbar/SearchBar";



// ── Drop indicator position ────────────────────────────────────────────────
type DropPosition = "before" | "after" | "inside";
interface DropTarget {
  nodeId: string;
  position: DropPosition;
}

// ── Single tree node row ───────────────────────────────────────────────────
function TreeNode({
  node,
  depth,
  selectedIds,
  onSelect,
  onContextMenu,
  expandedIds,
  onToggleExpand,
  dragId,
  dropTarget,
  onPointerDownGrip,
  nodeRefCallback,
  nodeTypes,
}: {
  node: LayoutNode;
  depth: number;
  selectedIds: Set<string>;
  onSelect: (id: string, e: { shiftKey?: boolean }) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  dragId: string | null;
  dropTarget: DropTarget | null;
  onPointerDownGrip: (e: React.PointerEvent, nodeId: string) => void;
  nodeRefCallback: (el: HTMLDivElement | null, id: string) => void;
  nodeTypes: Record<string, NodeTypeConfig>;
}) {
  const isSelected = selectedIds.has(node.id);
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isDragging = dragId === node.id;
  const isDropTarget = dropTarget?.nodeId === node.id;

  const config = nodeTypes[node.type];
  const label = (node.settings as { title?: string }).title || config?.label || node.type;

  // Direction-aware icon for container nodes
  const nodeIcon = node.type === "container"
    ? (node.settings as { direction?: string }).direction === "horizontal"
      ? <Columns3 className="h-3.5 w-3.5" />
      : <Rows3 className="h-3.5 w-3.5" />
    : config?.icon;

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
        onClick={(e) => onSelect(node.id, { shiftKey: e.shiftKey })}
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
        <span className="shrink-0 text-gold-600">{nodeIcon}</span>

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
            selectedIds={selectedIds}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            dragId={dragId}
            dropTarget={dropTarget}
            onPointerDownGrip={onPointerDownGrip}
            nodeRefCallback={nodeRefCallback}
            nodeTypes={nodeTypes}
          />
        ))}
    </>
  );
}

// ── Main exported component ────────────────────────────────────────────────
interface HierarchyTreeProps {
  nodes: LayoutNode[];
  selectedIds: Set<string>;
  onSelect: (id: string | null, e?: { shiftKey?: boolean }) => void;
  onAddChild: (parentId: string | null, type: NodeType) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  onMove: (dragId: string, targetId: string, position: DropPosition) => void;
  nodeTypes: Record<string, NodeTypeConfig>;
}

const POSITIONING_TYPES = new Set(["container", "section", "grid"]);

export function HierarchyTree({
  nodes,
  selectedIds,
  onSelect,
  onAddChild,
  onContextMenu,
  onMove,
  nodeTypes,
}: HierarchyTreeProps) {
  // Convenience: single selected for add-modal context
  const selectedId = selectedIds.size === 1 ? [...selectedIds][0] : null;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addModalOpen, setAddModalOpen] = useState(false);
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
        // Auto-expand when dropping inside a collapsed node
        if (dropTarget.position === "inside") {
          autoExpand(dropTarget.nodeId);
        }
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

  // Auto-expand ancestors & scroll into view when selectedIds changes (e.g. from preview click)
  const lastSelectedId = selectedIds.size > 0 ? [...selectedIds][selectedIds.size - 1] : null;
  useEffect(() => {
    if (!lastSelectedId) return;

    // Collect ancestor IDs for the selected node
    const ancestors: string[] = [];
    const findAncestors = (tree: LayoutNode[], target: string, path: string[]): boolean => {
      for (const node of tree) {
        if (node.id === target) {
          ancestors.push(...path);
          return true;
        }
        if (node.children.length > 0 && findAncestors(node.children, target, [...path, node.id])) {
          return true;
        }
      }
      return false;
    };
    findAncestors(nodes, lastSelectedId, []);

    if (ancestors.length > 0) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        for (const id of ancestors) next.add(id);
        if (next.size === prev.size) return prev;
        return next;
      });
    }

    // Scroll the selected node into view after expansion
    requestAnimationFrame(() => {
      const el = nodeEls.current.get(lastSelectedId);
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, [lastSelectedId, nodes]);

  // Items available for the add-modal (uses selectedId as parent context)
  const getModalItems = (): { positioning: { label: string; type: NodeType; icon: React.ReactNode }[]; elements: { label: string; type: NodeType; icon: React.ReactNode }[] } => {
    let allowedTypes: string[];
    if (selectedId) {
      const findType = (nodes: LayoutNode[], id: string): NodeType | null => {
        for (const n of nodes) {
          if (n.id === id) return n.type;
          const f = findType(n.children, id);
          if (f) return f;
        }
        return null;
      };
      const parentType = findType(nodes, selectedId);
      if (!parentType || !nodeTypes[parentType]) {
        allowedTypes = Object.keys(nodeTypes);
      } else {
        allowedTypes = nodeTypes[parentType].allowedChildren;
      }
    } else {
      allowedTypes = Object.keys(nodeTypes);
    }

    const positioning: { label: string; type: NodeType; icon: React.ReactNode }[] = [];
    const elements: { label: string; type: NodeType; icon: React.ReactNode }[] = [];

    for (const t of allowedTypes) {
      const cfg = nodeTypes[t];
      if (!cfg) continue;
      const item = { label: cfg.label, type: t, icon: cfg.icon };
      if (POSITIONING_TYPES.has(t)) positioning.push(item);
      else elements.push(item);
    }

    return { positioning, elements };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold-500/20 shrink-0">
        <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">
          Hierarchy
        </span>
        <button
          className="w-6! h-6! min-w-0! p-0! border-0! bg-transparent! text-gold-600! hover:text-gold-400!"
          onClick={() => setAddModalOpen(true)}
          title="Add element"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tree body */}
      <div
        className="flex-1 overflow-y-auto py-1"
        onContextMenu={(e) => {
          e.preventDefault();
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
            selectedIds={selectedIds}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            dragId={dragId}
            dropTarget={dropTarget}
            onPointerDownGrip={handlePointerDown}
            nodeRefCallback={nodeRefCallback}
            nodeTypes={nodeTypes}
          />
        ))}
      </div>

      {/* Add element modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)}>
        {(() => {
          const { positioning, elements } = getModalItems();
          return (
            <SearchBar
              isOpen={addModalOpen}
              onClose={() => setAddModalOpen(false)}
              placeholder="Search elements..."
              categories={[
                ...(positioning.length > 0 ? [{
                  name: "Positioning",
                  icon: <LayoutGrid className="h-4 w-4" />,
                  items: positioning.map((item) => ({ label: item.label, id: item.type })),
                  onSelect: (item: { label: string; id?: string }) => {
                    setAddModalOpen(false);
                    if (selectedId) autoExpand(selectedId);
                    onAddChild(selectedId, item.id as NodeType);
                  },
                }] : []),
                ...(elements.length > 0 ? [{
                  name: "Nodes",
                  icon: <Puzzle className="h-4 w-4" />,
                  items: elements.map((item) => ({ label: item.label, id: item.type })),
                  onSelect: (item: { label: string; id?: string }) => {
                    setAddModalOpen(false);
                    if (selectedId) autoExpand(selectedId);
                    onAddChild(selectedId, item.id as NodeType);
                  },
                }] : []),
              ]}
            />
          );
        })()}
      </Modal>
    </div>
  );
}
