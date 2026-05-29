// ── Node types ─────────────────────────────────────────────────────────────
export type NodeType = "section" | "row" | "column";

// ── Shared settings present on every node ──────────────────────────────────
export interface NodeSettings {
  padding: number;   // px, applied to all sides
  gap: number;       // px, space between children
}

// ── Per-type settings ──────────────────────────────────────────────────────
export interface SectionSettings extends NodeSettings {
  title: string;
}

export interface RowSettings extends NodeSettings {}

export interface ColumnSettings extends NodeSettings {
  width: number;     // percentage (1-100), 0 = auto (flex-grow)
}

// ── The recursive layout node ──────────────────────────────────────────────
export interface LayoutNode {
  id: string;
  type: NodeType;
  settings: SectionSettings | RowSettings | ColumnSettings;
  children: LayoutNode[];
}

// ── Helpers to create nodes with sensible defaults ─────────────────────────
export function createSectionNode(title = "Section"): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "section",
    settings: { title, padding: 8, gap: 8 } satisfies SectionSettings,
    children: [],
  };
}

export function createRowNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "row",
    settings: { padding: 0, gap: 8 } satisfies RowSettings,
    children: [],
  };
}

export function createColumnNode(width = 0): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "column",
    settings: { width, padding: 0, gap: 8 } satisfies ColumnSettings,
    children: [],
  };
}

// ── Tree manipulation helpers ──────────────────────────────────────────────

/** Immutably add a child node to the node with the given parentId. */
export function addChild(
  nodes: LayoutNode[],
  parentId: string,
  child: LayoutNode,
): LayoutNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, child] };
    }
    if (node.children.length > 0) {
      return { ...node, children: addChild(node.children, parentId, child) };
    }
    return node;
  });
}

/** Immutably remove the node with the given id from the tree. */
export function removeNode(
  nodes: LayoutNode[],
  targetId: string,
): LayoutNode[] {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => ({
      ...node,
      children: removeNode(node.children, targetId),
    }));
}

/** Immutably update settings on the node with the given id. */
export function updateNodeSettings(
  nodes: LayoutNode[],
  targetId: string,
  patch: Partial<SectionSettings & RowSettings & ColumnSettings>,
): LayoutNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, settings: { ...node.settings, ...patch } };
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNodeSettings(node.children, targetId, patch) };
    }
    return node;
  });
}

/** Find a node by id anywhere in the tree. */
export function findNode(
  nodes: LayoutNode[],
  targetId: string,
): LayoutNode | undefined {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    const found = findNode(node.children, targetId);
    if (found) return found;
  }
  return undefined;
}

/** Check if `ancestorId` is an ancestor of (or equal to) `nodeId`. */
export function isAncestor(
  nodes: LayoutNode[],
  ancestorId: string,
  nodeId: string,
): boolean {
  if (ancestorId === nodeId) return true;
  const ancestor = findNode(nodes, ancestorId);
  if (!ancestor) return false;
  return !!findNode(ancestor.children, nodeId);
}

/**
 * Move a node from its current position to a new location.
 * `targetId`  — the node to drop relative to (or the parent to drop into).
 * `position`  — "before" | "after" | "inside" (as last child of target).
 */
export function moveNode(
  nodes: LayoutNode[],
  dragId: string,
  targetId: string,
  position: "before" | "after" | "inside",
): LayoutNode[] {
  const dragNode = findNode(nodes, dragId);
  if (!dragNode) return nodes;
  // Prevent dropping into own descendants
  if (isAncestor(nodes, dragId, targetId)) return nodes;

  // 1. Remove the dragged node
  let result = removeNode(nodes, dragId);

  // 2. Insert at the new location
  if (position === "inside") {
    result = addChild(result, targetId, dragNode);
  } else {
    result = insertAdjacent(result, targetId, dragNode, position);
  }
  return result;
}

/** Insert a node before or after a sibling at any depth. */
function insertAdjacent(
  nodes: LayoutNode[],
  siblingId: string,
  newNode: LayoutNode,
  position: "before" | "after",
): LayoutNode[] {
  const idx = nodes.findIndex((n) => n.id === siblingId);
  if (idx !== -1) {
    const insertAt = position === "before" ? idx : idx + 1;
    return [...nodes.slice(0, insertAt), newNode, ...nodes.slice(insertAt)];
  }
  return nodes.map((node) => ({
    ...node,
    children: insertAdjacent(node.children, siblingId, newNode, position),
  }));
}

/** Move a node up or down among its siblings. Returns unchanged tree if at boundary. */
export function moveSibling(
  nodes: LayoutNode[],
  targetId: string,
  direction: "up" | "down",
): LayoutNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId);
  if (idx !== -1) {
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= nodes.length) return nodes;
    const result = [...nodes];
    [result[idx], result[swapIdx]] = [result[swapIdx], result[idx]];
    return result;
  }
  return nodes.map((node) => ({
    ...node,
    children: moveSibling(node.children, targetId, direction),
  }));
}

/** Check whether a node is the first or last among its siblings. */
export function getSiblingPosition(
  nodes: LayoutNode[],
  targetId: string,
): { isFirst: boolean; isLast: boolean } | null {
  const idx = nodes.findIndex((n) => n.id === targetId);
  if (idx !== -1) {
    return { isFirst: idx === 0, isLast: idx === nodes.length - 1 };
  }
  for (const node of nodes) {
    const result = getSiblingPosition(node.children, targetId);
    if (result) return result;
  }
  return null;
}
