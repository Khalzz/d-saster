import { useState, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Copy, Trash2 } from "lucide-react";
import type { LayoutNode, NodeType, NodeTypeConfig } from "../types";
import {
  addChild,
  removeNode,
  updateNodeSettings,
  findNode,
  moveNode,
  cloneNode,
  insertAdjacent,
} from "../types";
import { HierarchyTree } from "./HierarchyTree";
import { SheetPreview } from "./SheetPreview";
import { SettingsPanel } from "./SettingsPanel";
import { coreNodeTypes } from "./nodes";
import { invoke } from "@tauri-apps/api/core";
import { collectSheetVars, labelToVar } from "../handlebars";
import type { VarDef } from "../types";
import type { Ruleset } from "../../ruleset/ruleset-editor";

// ── Context menu state ─────────────────────────────────────────────────────
interface MenuState {
  nodeId: string;
  top?: number;
  bottom?: number;
  left: number;
}

interface FormEditorProps {
  nodes: LayoutNode[];
  onChange: (nodes: LayoutNode[]) => void;
  nodeTypes: Record<string, NodeTypeConfig>;
  extraVars?: VarDef[];
}

export function FormEditor({ nodes, onChange, nodeTypes, extraVars = [] }: FormEditorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [statVars, setStatVars] = useState<VarDef[]>([]);
  const [specieVars, setSpecieVars] = useState<VarDef[]>([]);

  useEffect(() => {
    invoke<Ruleset[]>("list_rulesets").then((rulesets) => {
      const statSeen = new Set<string>();
      const statList: VarDef[] = [];
      const specieSeen = new Set<string>();
      const specieList: VarDef[] = [
        { key: "specie.name", description: "Selected species name" },
        { key: "specie.size", description: "Selected species size" },
        { key: "specie.unit", description: "Selected species distance unit (ft / m)" },
      ];
      specieSeen.add("specie.name");
      specieSeen.add("specie.size");
      specieSeen.add("specie.unit");

      for (const r of rulesets ?? []) {
        for (const stat of r.stats ?? []) {
          const base = `stat.${stat.key}`;
          if (!statSeen.has(base)) {
            statSeen.add(base);
            statList.push({ key: `${base}.points`, description: `${stat.label} — raw points` });
            statList.push({ key: `${base}.mod`,    description: `${stat.label} — modifier` });
          }
        }
        for (const sp of r.species ?? []) {
          for (const m of sp.movements ?? []) {
            const k = `specie.movement.${labelToVar(m.label)}`;
            if (!specieSeen.has(k)) { specieSeen.add(k); specieList.push({ key: k, description: `Species movement — ${m.label}` }); }
          }
          for (const s of sp.senses ?? []) {
            const k = `specie.sense.${labelToVar(s.label)}`;
            if (!specieSeen.has(k)) { specieSeen.add(k); specieList.push({ key: k, description: `Species sense — ${s.label}` }); }
          }
          for (const key of Object.keys(sp.statModifiers ?? {})) {
            const k = `specie.stat.${key}`;
            if (!specieSeen.has(k)) { specieSeen.add(k); specieList.push({ key: k, description: `Species stat modifier — ${key}` }); }
          }
        }
      }
      setStatVars(statList);
      setSpecieVars(specieList);
    }).catch(() => {});
  }, []);

  // Convenience: single selected node for settings panel
  const selectedId = selectedIds.size === 1 ? [...selectedIds][0] : null;

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

  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const menuH = 120;
    const spaceBelow = window.innerHeight - e.clientY;
    if (spaceBelow < menuH && e.clientY > spaceBelow) {
      setMenu({ nodeId, bottom: window.innerHeight - e.clientY, left: e.clientX });
    } else {
      setMenu({ nodeId, top: e.clientY, left: e.clientX });
    }
  }, []);

  const availableVars = useMemo(() => {
    const sheet = collectSheetVars(nodes);
    const seen = new Set(sheet.map(v => v.key));
    const all = [...sheet];
    for (const v of [...statVars, ...specieVars, ...extraVars]) {
      if (!seen.has(v.key)) { seen.add(v.key); all.push(v); }
    }
    return all;
  }, [nodes, statVars, specieVars, extraVars]);

  // Merge core layout types (row/column) with consumer-provided types.
  // Core types' allowedChildren are extended with consumer-provided type keys.
  const allNodeTypes = useMemo(() => {
    const extraKeys = Object.keys(nodeTypes);
    const merged: Record<string, NodeTypeConfig> = { ...nodeTypes };
    for (const [key, config] of Object.entries(coreNodeTypes)) {
      merged[key] = {
        ...config,
        allowedChildren: [...config.allowedChildren, ...extraKeys],
      };
    }
    return merged;
  }, [nodeTypes]);

  const selectedNode = selectedId ? findNode(nodes, selectedId) ?? null : null;

  // Flatten tree into ordered list of IDs for shift-range selection
  const flatIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (tree: LayoutNode[]) => {
      for (const n of tree) {
        ids.push(n.id);
        walk(n.children);
      }
    };
    walk(nodes);
    return ids;
  }, [nodes]);

  const handleSelect = useCallback(
    (id: string | null, e?: { shiftKey?: boolean }) => {
      if (!id) {
        setSelectedIds(new Set());
        return;
      }
      if (e?.shiftKey && selectedIds.size > 0) {
        // Range select from last selected to this id
        const lastId = [...selectedIds][selectedIds.size - 1];
        const startIdx = flatIds.indexOf(lastId);
        const endIdx = flatIds.indexOf(id);
        if (startIdx !== -1 && endIdx !== -1) {
          const from = Math.min(startIdx, endIdx);
          const to = Math.max(startIdx, endIdx);
          const range = flatIds.slice(from, to + 1);
          setSelectedIds(new Set([...selectedIds, ...range]));
        } else {
          setSelectedIds(new Set([id]));
        }
      } else {
        setSelectedIds(new Set([id]));
      }
    },
    [selectedIds, flatIds],
  );

  const handleAddChild = useCallback(
    (parentId: string | null, type: NodeType) => {
      const config = allNodeTypes[type];
      if (!config) return;
      const newNode = config.factory();

      if (parentId) {
        onChange(addChild(nodes, parentId, newNode));
      } else {
        onChange([...nodes, newNode]);
      }
      setSelectedIds(new Set([newNode.id]));
    },
    [allNodeTypes, nodes, onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(removeNode(nodes, id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [nodes, onChange],
  );

  const handleClone = useCallback(
    (id: string) => {
      const original = findNode(nodes, id);
      if (!original) return;
      const clone = cloneNode(original);
      onChange(insertAdjacent(nodes, id, clone, "after"));
      setSelectedIds(new Set([clone.id]));
    },
    [nodes, onChange],
  );

  const handleSettingsChange = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selectedId) return;
      onChange(updateNodeSettings(nodes, selectedId, patch));
    },
    [selectedId, nodes, onChange],
  );

  const handleMove = useCallback(
    (dragId: string, targetId: string, position: "before" | "after" | "inside") => {
      onChange(moveNode(nodes, dragId, targetId, position));
    },
    [nodes, onChange],
  );

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      {/* Left — hierarchy tree */}
      <aside className="w-60 shrink-0 bg-surface border-r border-gold-500/20 overflow-hidden flex flex-col">
        <HierarchyTree
          nodes={nodes}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onAddChild={handleAddChild}
          onContextMenu={handleContextMenu}
          onMove={handleMove}
          nodeTypes={allNodeTypes}
        />
      </aside>

      {/* Center — live visual preview */}
      <SheetPreview
        nodes={nodes}
        selectedIds={selectedIds}
        onSelect={(id) => handleSelect(id)}
        onContextMenu={handleContextMenu}
        nodeTypes={allNodeTypes}
      />

      {/* Right — settings inspector */}
      <aside className="w-64 shrink-0 bg-surface border-l border-gold-500/20 overflow-hidden flex flex-col">
        <SettingsPanel
          node={selectedNode}
          selectedCount={selectedIds.size}
          onChange={handleSettingsChange}
          nodeTypes={allNodeTypes}
          availableVars={availableVars}
        />
      </aside>

      {/* Context menu (shared by hierarchy & preview) */}
      {menu &&
        createPortal(
          <>
            <div className="fixed inset-0 z-998" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
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
              {/* Node name header */}
              <div className="px-3 py-1.5 border-b border-gold-500/10">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-600">
                  {(() => {
                    const node = findNode(nodes, menu.nodeId);
                    if (!node) return menu.nodeId;
                    const cfg = allNodeTypes[node.type];
                    return (node.settings as { title?: string; label?: string }).title
                      || (node.settings as { title?: string; label?: string }).label
                      || cfg?.label
                      || node.type;
                  })()}
                </span>
              </div>
              <button
                className="w-full! h-8! text-[11px]! border-0! outline-none! rounded-none! bg-transparent! text-gold-400! hover:bg-gold-500/10! focus:outline-none! focus:ring-0! flex items-center gap-2 px-3! justify-start!"
                onClick={() => {
                  const id = menu.nodeId;
                  setMenu(null);
                  handleClone(id);
                }}
              >
                <Copy className="h-3 w-3 shrink-0" />
                Clone
              </button>
              <button
                className="w-full! h-8! text-[11px]! border-0! outline-none! rounded-none! bg-transparent! text-[#ef4444]! hover:bg-[#ef4444]/10! focus:outline-none! focus:ring-0! flex items-center gap-2 px-3! justify-start!"
                onClick={() => {
                  const id = menu.nodeId;
                  setMenu(null);
                  handleDelete(id);
                }}
              >
                <Trash2 className="h-3 w-3 shrink-0" />
                Delete
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
