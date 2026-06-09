// ── Node types ─────────────────────────────────────────────────────────────
export type NodeType = string;

export interface VarDef {
  key: string;
  description: string;
}

// ── Node type config (passed to the editor) ────────────────────────────────
export interface NodeTypeConfig {
  icon: React.ReactNode;
  label: string;
  allowedChildren: string[];
  factory: () => LayoutNode;
  Preview: React.ComponentType<NodePreviewProps>;
  Settings: React.ComponentType<NodeSettingsProps>;
}

export interface NodePreviewProps {
  node: LayoutNode;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  renderChildren: (children: LayoutNode[]) => React.ReactNode;
}

export interface NodeSettingsProps {
  settings: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
  availableVars?: VarDef[];
}

// ── Shared settings present on every node ──────────────────────────────────
export interface NodeSettings {
  padding: number;   // px, applied to all sides
  gap: number;       // px, space between children
}

// ── Per-type settings ──────────────────────────────────────────────────────
export interface SectionSettings extends NodeSettings {
  title: string;
  width: number; // percentage, 0 = full width
  description: string;
  direction: "row" | "column";
}

export interface ContainerSettings extends NodeSettings {
  title: string;
  direction: "horizontal" | "vertical";
  width: number;     // percentage (1-100), 0 = auto (flex-grow)
}

export interface ImageSettings extends NodeSettings {
  width: number;     // percentage (1-100), 0 = auto
  height: number;    // px, 0 = auto
  squared: boolean;  // force 1:1 aspect ratio
}

export interface TextInputSettings extends NodeSettings {
  label: string;
  placeholder: string;
  width: number; // percentage, 0 = full width
}

export interface LevelCountSettings extends NodeSettings {
  label: string;
  min: number;
  max: number;
}

export interface StaticCounterSettings extends NodeSettings {
  label: string;   // handlebar expression
  value: string;   // handlebar expression
  direction: "vertical" | "horizontal";
  shieldView: boolean;
  width: number;   // percentage, 0 = auto
  height: number;  // px, 0 = auto
}

export interface CounterSettings extends NodeSettings {
  label: string;
  max: number;
  hasMax: boolean;
  allowNegative: boolean;
  isStatic: boolean;
  staticValue: string;
  // Static display options
  shieldView: boolean; // rounded-full on bottom, square on top; off = rounded-md all
  width: number;       // px, 0 = auto
  height: number;      // px, 0 = auto
}

export interface ClassSelectorSettings extends NodeSettings {
  label: string;
  allowMulticlass: boolean;
}

export interface GridSettings extends NodeSettings {
  columns: number;   // number of grid columns
  rows: number;      // number of grid rows (0 = auto)
}

export interface StatSettings extends NodeSettings {
  statKey: string;   // key referencing a StatDefinition from the ruleset
  width: number;     // percentage (1-100), 0 = auto
}

export interface AutoStatsSettings extends NodeSettings {
  columns: number;   // grid columns for the auto-rendered stats
  width: number;     // percentage (1-100), 0 = auto
  statKeys: string[]; // empty = all stats from ruleset
}

export interface AutoSkillsSettings extends NodeSettings {
  columns: number;   // grid columns for the auto-rendered skills
  width: number;     // percentage (1-100), 0 = auto
}

export interface AutoSavingThrowsSettings extends NodeSettings {
  columns: number;
  formula: string;
  width: number;     // percentage (1-100), 0 = auto
}

export interface ProficiencyBonusSettings extends NodeSettings {
  formula: string;   // handlebar formula, default: "Math.floor(({{level}} - 1) / 4) + 2"
  width: number;     // percentage (1-100), 0 = auto
}

export interface SpecieSettings extends NodeSettings {
  label: string;
  width: number;     // percentage (1-100), 0 = auto
}

export interface FeaturesAndTraitsSettings extends NodeSettings {
  width: number;     // percentage (1-100), 0 = auto
}

// ── The recursive layout node ──────────────────────────────────────────────
export interface LayoutNode {
  id: string;
  type: NodeType;
  settings: SectionSettings | ContainerSettings | ImageSettings | TextInputSettings | LevelCountSettings | CounterSettings | StaticCounterSettings | ClassSelectorSettings | GridSettings | StatSettings | AutoStatsSettings | AutoSkillsSettings | AutoSavingThrowsSettings | ProficiencyBonusSettings | SpecieSettings | FeaturesAndTraitsSettings;
  children: LayoutNode[];
}

// ── Helpers to create nodes with sensible defaults ─────────────────────────
export function createSectionNode(title = "Section"): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "section",
    settings: { title, padding: 8, gap: 8, width: 0, description: "", direction: "column" } satisfies SectionSettings,
    children: [],
  };
}

export function createContainerNode(direction: "horizontal" | "vertical" = "horizontal", width = 0): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "container",
    settings: { title: "Container", direction, width, padding: 0, gap: 8 } satisfies ContainerSettings,
    children: [],
  };
}

export function createImageNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "image",
    settings: { width: 0, height: 0, squared: false, padding: 0, gap: 0 } satisfies ImageSettings,
    children: [],
  };
}

export function createTextInputNode(label = "Label"): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "text-input",
    settings: { label, placeholder: "", width: 0, padding: 0, gap: 0 } satisfies TextInputSettings,
    children: [],
  };
}

export function createLevelCountNode(label = "Level"): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "level-count",
    settings: { label, min: 0, max: 20, padding: 0, gap: 0 } satisfies LevelCountSettings,
    children: [],
  };
}

export function createCounterNode(label = "Counter"): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "counter",
    settings: { label, max: 100, hasMax: false, allowNegative: false, isStatic: false, staticValue: "", shieldView: false, width: 0, height: 0, padding: 0, gap: 0 } satisfies CounterSettings,
    children: [],
  };
}

export function createStaticCounterNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "static-counter",
    settings: { label: "Label", value: "", direction: "vertical", shieldView: false, width: 0, height: 0, padding: 0, gap: 0 } satisfies StaticCounterSettings,
    children: [],
  };
}

export function createClassSelectorNode(label = "Class"): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "class-selector",
    settings: { label, allowMulticlass: true, padding: 0, gap: 0 } satisfies ClassSelectorSettings,
    children: [],
  };
}

export function createGridNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "grid",
    settings: { columns: 2, rows: 0, padding: 0, gap: 4 } satisfies GridSettings,
    children: [],
  };
}

export function createStatNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "stat",
    settings: { statKey: "", padding: 0, gap: 0, width: 0 } satisfies StatSettings,
    children: [],
  };
}

export function createAutoStatsNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "auto-stats",
    settings: { columns: 2, padding: 0, gap: 4, width: 0, statKeys: [] } satisfies AutoStatsSettings,
    children: [],
  };
}

export function createAutoSkillsNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "auto-skills",
    settings: { columns: 2, padding: 0, gap: 4, width: 0 } satisfies AutoSkillsSettings,
    children: [],
  };
}

export function createAutoSavingThrowsNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "auto-saving-throws",
    settings: { columns: 3, padding: 0, gap: 4, formula: "{{stat_mod}} + {{proficiency_bonus}}", width: 0 } satisfies AutoSavingThrowsSettings,
    children: [],
  };
}

export function createSpecieNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "specie",
    settings: { label: "Specie", width: 0, padding: 0, gap: 0 } satisfies SpecieSettings,
    children: [],
  };
}

export function createFeaturesAndTraitsNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "features-and-traits",
    settings: { width: 0, padding: 0, gap: 0 } satisfies FeaturesAndTraitsSettings,
    children: [],
  };
}

export function createProficiencyBonusNode(): LayoutNode {
  return {
    id: crypto.randomUUID(),
    type: "proficiency-bonus",
    settings: { formula: "Math.floor(({{level}} - 1) / 4) + 2", width: 0, padding: 0, gap: 0 } satisfies ProficiencyBonusSettings,
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
  patch: Record<string, unknown>,
): LayoutNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, settings: { ...(node.settings as unknown as Record<string, unknown>), ...patch } as unknown as LayoutNode["settings"] };
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
export function insertAdjacent(
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

/** Deep-clone a node, assigning new IDs to it and all descendants. */
export function cloneNode(node: LayoutNode): LayoutNode {
  return {
    ...node,
    id: crypto.randomUUID(),
    settings: { ...node.settings },
    children: node.children.map(cloneNode),
  };
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
