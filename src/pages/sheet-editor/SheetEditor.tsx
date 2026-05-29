import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { LayoutNode, NodeType } from "./types";
import {
  createSectionNode,
  createRowNode,
  createColumnNode,
  addChild,
  removeNode,
  updateNodeSettings,
  findNode,
  moveNode,
  moveSibling,
  getSiblingPosition,
} from "./types";
import { HierarchyTree } from "./components/HierarchyTree";
import { SheetPreview } from "./components/SheetPreview";
import { SettingsPanel } from "./components/SettingsPanel";

export default function SheetEditor() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<LayoutNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = selectedId ? findNode(nodes, selectedId) ?? null : null;

  // ── Tree operations ──────────────────────────────────────────────────────
  const handleAddChild = useCallback(
    (parentId: string | null, type: NodeType) => {
      const newNode =
        type === "section"
          ? createSectionNode()
          : type === "row"
            ? createRowNode()
            : createColumnNode();

      if (parentId) {
        setNodes((prev) => addChild(prev, parentId, newNode));
      } else {
        setNodes((prev) => [...prev, newNode]);
      }
      setSelectedId(newNode.id);
    },
    [],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setNodes((prev) => removeNode(prev, id));
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [],
  );

  const handleSettingsChange = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selectedId) return;
      setNodes((prev) => updateNodeSettings(prev, selectedId, patch));
    },
    [selectedId],
  );

  const handleMoveUp = useCallback(
    (id: string) => setNodes((prev) => moveSibling(prev, id, "up")),
    [],
  );

  const handleMoveDown = useCallback(
    (id: string) => setNodes((prev) => moveSibling(prev, id, "down")),
    [],
  );

  const handleMove = useCallback(
    (dragId: string, targetId: string, position: "before" | "after" | "inside") => {
      setNodes((prev) => moveNode(prev, dragId, targetId, position));
    },
    [],
  );

  const canMoveUp = useCallback(
    (id: string) => {
      const pos = getSiblingPosition(nodes, id);
      return pos ? !pos.isFirst : false;
    },
    [nodes],
  );

  const canMoveDown = useCallback(
    (id: string) => {
      const pos = getSiblingPosition(nodes, id);
      return pos ? !pos.isLast : false;
    },
    [nodes],
  );

  const handleSave = () => {
    toast.success("Sheet saved!");
  };

  return (
    <main className="h-screen flex flex-col bg-base overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
        <button
          className="w-9! h-9! flex items-center justify-center"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-gold-400 font-semibold text-sm flex-1">
          Sheet Editor
        </h1>
        <button
          className="h-9! px-4! text-xs! gap-1.5! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
          onClick={handleSave}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </div>

      {/* ── Body: 3-panel layout ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left — hierarchy tree */}
        <aside className="w-60 shrink-0 bg-surface border-r border-gold-500/20 overflow-hidden flex flex-col">
          <HierarchyTree
            nodes={nodes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddChild={handleAddChild}
            onDelete={handleDelete}
            onMove={handleMove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
          />
        </aside>

        {/* Center — live visual preview */}
        <SheetPreview
          nodes={nodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Right — settings inspector */}
        <aside className="w-64 shrink-0 bg-surface border-l border-gold-500/20 overflow-hidden flex flex-col">
          <SettingsPanel
            node={selectedNode}
            onChange={handleSettingsChange}
          />
        </aside>
      </div>
    </main>
  );
}
