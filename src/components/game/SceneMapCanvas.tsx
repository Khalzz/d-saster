import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Crosshair, Mouse, MousePointerClick, Pencil, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import type { Campaign, SceneNode } from "../campaign/CampaignSelector";
import type { Scene } from "./SceneEditor";
import { DEFAULT_CELL_SIZE } from "./SceneEditor";

interface SavedSceneData {
  id: string;
  name: string;
  gridType: string;
  cols: number;
  rows: number;
  disabledCells: string[];
  bg?: string;
  bgBounds?: { w: number; h: number };
  cellSize?: number;
  lastEdited?: string;
  lastEditor?: string;
}

type Direction = "top" | "right" | "bottom" | "left";

const NODE_W = 140;
const NODE_H = 90;

const PORT_RADIUS = 6;

const PORT_OFFSETS: Record<Direction, { x: number; y: number }> = {
  top: { x: NODE_W / 2, y: -PORT_RADIUS * 2 },
  bottom: { x: NODE_W / 2, y: NODE_H + PORT_RADIUS * 2 },
  left: { x: -PORT_RADIUS * 2, y: NODE_H / 2 },
  right: { x: NODE_W + PORT_RADIUS * 2, y: NODE_H / 2 },
};

const OPPOSITE: Record<Direction, Direction> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

interface Props {
  campaign: Campaign;
  onSceneSelect: (scene: Scene) => void;
  activeSceneId: string | null;
}

// Module-level cache so scene data persists across mounts (navigation)
const scenesCache: Record<string, SavedSceneData[]> = {};

export default function SceneMapCanvas({ campaign, onSceneSelect, activeSceneId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const cached = scenesCache[campaign.id];
  const [scenes, setScenes] = useState<SavedSceneData[]>(cached ?? []);
  const [scenesLoaded, setScenesLoaded] = useState(!!cached);
  const [nodes, setNodes] = useState<SceneNode[]>(campaign.sceneMap ?? []);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [connecting, setConnecting] = useState<{ fromId: string; fromDir: Direction; mouseX: number; mouseY: number } | null>(null);
  const [pendingConnect, setPendingConnect] = useState<{ fromId: string; fromDir: Direction; startClientX: number; startClientY: number } | null>(null);
  const hasFittedRef = useRef(false);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const panningRef = useRef(panning);
  panningRef.current = panning;

  // Load campaign scenes
  useEffect(() => {
    invoke<SavedSceneData[]>("list_scenes").then(all => {
      const filtered = all.filter(s => (campaign.scenes ?? []).includes(s.id));
      scenesCache[campaign.id] = filtered;
      setScenes(filtered);
      setScenesLoaded(true);
    }).catch(() => setScenesLoaded(true));
  }, [campaign]);

  // Auto-add nodes for scenes not yet on the map
  useEffect(() => {
    if (!scenes.length) return;
    const currentNodes = nodesRef.current;
    const existingIds = new Set(currentNodes.map(n => n.id));
    const newNodes: SceneNode[] = [];

    // Place new nodes near existing ones
    let baseX = 50;
    let baseY = 50;
    if (currentNodes.length > 0) {
      const maxX = Math.max(...currentNodes.map(n => n.x));
      const minY = Math.min(...currentNodes.map(n => n.y));
      baseX = maxX + 200;
      baseY = minY;
    }

    let added = 0;
    scenes.forEach((s) => {
      if (!existingIds.has(s.id)) {
        newNodes.push({
          id: s.id,
          x: baseX + (added % 3) * 180,
          y: baseY + Math.floor(added / 3) * 130,
          connections: {},
        });
        added++;
      }
    });
    if (newNodes.length > 0) {
      const updated = [...currentNodes, ...newNodes];
      setNodes(updated);
      persist(updated);
    }
  }, [scenes]);

  const persist = useCallback((updatedNodes: SceneNode[]) => {
    const updatedCampaign = { ...campaign, sceneMap: updatedNodes };
    invoke("save_campaign", { campaign: updatedCampaign }).then(() => {
      window.dispatchEvent(new Event("campaign-updated"));
    }).catch(() => {});
  }, [campaign]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;
    setDragging({ id: nodeId, offsetX: mx - node.x, offsetY: my - node.y });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const rect = containerRef.current!.getBoundingClientRect();
      const mx = (e.clientX - rect.left - pan.x) / zoom;
      const my = (e.clientY - rect.top - pan.y) / zoom;
      setNodes(prev => prev.map(n =>
        n.id === dragging.id ? { ...n, x: mx - dragging.offsetX, y: my - dragging.offsetY } : n
      ));
    }
    if (panning) {
      setPan({
        x: panning.panX + (e.clientX - panning.startX),
        y: panning.panY + (e.clientY - panning.startY),
      });
    }
    if (pendingConnect) {
      const dx = e.clientX - pendingConnect.startClientX;
      const dy = e.clientY - pendingConnect.startClientY;
      if (dx * dx + dy * dy > 25) {
        const rect = containerRef.current!.getBoundingClientRect();
        setPendingConnect(null);
        setConnecting({
          fromId: pendingConnect.fromId,
          fromDir: pendingConnect.fromDir,
          mouseX: (e.clientX - rect.left - pan.x) / zoom,
          mouseY: (e.clientY - rect.top - pan.y) / zoom,
        });
      }
    }
    if (connecting) {
      const rect = containerRef.current!.getBoundingClientRect();
      setConnecting({
        ...connecting,
        mouseX: (e.clientX - rect.left - pan.x) / zoom,
        mouseY: (e.clientY - rect.top - pan.y) / zoom,
      });
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      persist(nodes);
      setDragging(null);
    }
    if (panning) setPanning(null);
    setPendingConnect(null);
    setConnecting(null);
  };

  const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, dir: Direction) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const node = nodes.find(n => n.id === nodeId)!;
    if (node.connections[dir]) {
      removeConnection(nodeId, dir);
      return;
    }
    setPendingConnect({ fromId: nodeId, fromDir: dir, startClientX: e.clientX, startClientY: e.clientY });
  };

  const areAlreadyConnected = (idA: string, idB: string) => {
    const nodeA = nodes.find(n => n.id === idA);
    const nodeB = nodes.find(n => n.id === idB);
    if (!nodeA || !nodeB) return false;
    const aConnectsB = Object.values(nodeA.connections).includes(idB);
    const bConnectsA = Object.values(nodeB.connections).includes(idA);
    return aConnectsB || bConnectsA;
  };

  const handlePortMouseUp = (e: React.MouseEvent, nodeId: string, dir: Direction) => {
    e.stopPropagation();
    if (!connecting || connecting.fromId === nodeId) return;
    // Prevent duplicate connection between same pair
    if (areAlreadyConnected(connecting.fromId, nodeId)) {
      setConnecting(null);
      return;
    }
    // Create bidirectional connection
    const updated = nodes.map(n => {
      if (n.id === connecting.fromId) {
        return { ...n, connections: { ...n.connections, [connecting.fromDir]: nodeId } };
      }
      if (n.id === nodeId) {
        return { ...n, connections: { ...n.connections, [dir]: connecting.fromId } };
      }
      return n;
    });
    setNodes(updated);
    persist(updated);
    setConnecting(null);
  };

  const removeConnection = (nodeId: string, dir: Direction) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const targetId = node.connections[dir];
    if (!targetId) return;
    const updated = nodes.map(n => {
      if (n.id === nodeId) {
        const conns = { ...n.connections };
        delete conns[dir];
        return { ...n, connections: conns };
      }
      if (n.id === targetId) {
        const conns = { ...n.connections };
        (Object.keys(conns) as Direction[]).forEach(d => {
          if (conns[d] === nodeId) delete conns[d];
        });
        return { ...n, connections: conns };
      }
      return n;
    });
    setNodes(updated);
    persist(updated);
  };

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    // Don't zoom while panning
    if (panningRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const prevZoom = zoomRef.current;
    const newZoom = Math.min(2, Math.max(0.3, prevZoom + delta));
    if (newZoom === prevZoom) return;
    const scale = newZoom / prevZoom;
    const prevPan = panRef.current;
    setPan({
      x: mouseX - (mouseX - prevPan.x) * scale,
      y: mouseY - (mouseY - prevPan.y) * scale,
    });
    setZoom(newZoom);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const fitView = () => {
    if (!nodes.length || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const minX = Math.min(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxX = Math.max(...nodes.map(n => n.x + NODE_W));
    const maxY = Math.max(...nodes.map(n => n.y + NODE_H));
    const contentW = maxX - minX + 60;
    const contentH = maxY - minY + 60;
    const newZoom = Math.min(1.2, Math.min(rect.width / contentW, rect.height / contentH));
    setZoom(newZoom);
    setPan({
      x: (rect.width - contentW * newZoom) / 2 - minX * newZoom + 30 * newZoom,
      y: (rect.height - contentH * newZoom) / 2 - minY * newZoom + 30 * newZoom,
    });
  };

  // Auto-center nodes on mount once they're loaded
  useEffect(() => {
    if (hasFittedRef.current || !nodes.length || !containerRef.current) return;
    hasFittedRef.current = true;
    requestAnimationFrame(fitView);
  }, [nodes]);

  const loadScene = (s: SavedSceneData) => {
    onSceneSelect({
      id: s.id,
      name: s.name,
      gridType: s.gridType as "hex" | "square",
      cols: s.cols,
      rows: s.rows,
      disabledCells: new Set(s.disabledCells),
      bg: s.bg,
      bgBounds: s.bgBounds,
      cellSize: s.cellSize ?? DEFAULT_CELL_SIZE,
      lastEdited: s.lastEdited,
      lastEditor: s.lastEditor,
    });
  };

  const getSceneName = (id: string) => scenes.find(s => s.id === id)?.name ?? "?";

  const editScene = (sceneData: SavedSceneData) => {
    navigate("/scene-editor", { state: { existing: sceneData } });
  };

  const deleteScene = async (id: string) => {
    const updatedNodes = nodes
      .filter(n => n.id !== id)
      .map(n => {
        const conns = { ...n.connections };
        (Object.keys(conns) as Direction[]).forEach(dir => {
          if (conns[dir] === id) delete conns[dir];
        });
        return { ...n, connections: conns };
      });
    const updatedScenes = (campaign.scenes ?? []).filter(s => s !== id);
    const updatedCampaign = { ...campaign, sceneMap: updatedNodes, scenes: updatedScenes };
    await invoke("save_campaign", { campaign: updatedCampaign }).catch(() => {});
    window.dispatchEvent(new Event("campaign-updated"));
    setNodes(updatedNodes);
    setScenes(prev => prev.filter(s => s.id !== id));
    setPendingDelete(null);
    setContextMenu(null);
  };

  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ nodeId, x: e.clientX, y: e.clientY });
  };

  const contextMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contextMenu) return;
    const handleDown = (e: MouseEvent) => {
      if (contextMenuRef.current?.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [contextMenu]);

  // Render connections as SVG lines
  const renderConnections = () => {
    const lines: React.ReactNode[] = [];
    const rendered = new Set<string>();
    nodes.forEach(node => {
      (Object.entries(node.connections) as [Direction, string | undefined][]).forEach(([dir, targetId]) => {
        if (!targetId) return;
        // Deduplicate: only render once per pair
        const pairKey = [node.id, targetId].sort().join("-");
        if (rendered.has(pairKey)) return;
        rendered.add(pairKey);
        const target = nodes.find(n => n.id === targetId);
        if (!target) return;
        // Find which port on the target points back to this node
        const targetDir = (Object.entries(target.connections) as [Direction, string | undefined][])
          .find(([, id]) => id === node.id)?.[0] ?? OPPOSITE[dir];
        const from = { x: node.x + PORT_OFFSETS[dir].x, y: node.y + PORT_OFFSETS[dir].y };
        const to = { x: target.x + PORT_OFFSETS[targetDir].x, y: target.y + PORT_OFFSETS[targetDir].y };
        lines.push(
          <line
            key={pairKey}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            stroke="rgba(212,175,55,0.4)"
            strokeWidth={2}
            strokeDasharray="6 3"
          />
        );
      });
    });
    return lines;
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 pl-4 border-b border-gold-500/20 shrink-0">
        <p className="text-gold-400 font-medium text-sm">Scene Map</p>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Center button */}
        <button onClick={fitView} className="absolute bottom-3 right-3 z-10 p-1.5 text-gold-600 hover:text-gold-400 bg-base/80 rounded" title="Center"><Crosshair className="h-4 w-4" /></button>
        {scenesLoaded && (<>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: "visible" }}
        >
          <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
            {renderConnections()}
            {connecting && (
              <line
                x1={nodes.find(n => n.id === connecting.fromId)!.x + PORT_OFFSETS[connecting.fromDir].x}
                y1={nodes.find(n => n.id === connecting.fromId)!.y + PORT_OFFSETS[connecting.fromDir].y}
                x2={connecting.mouseX}
                y2={connecting.mouseY}
                stroke="rgba(212,175,55,0.6)"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}
          </g>
        </svg>

        <div
          className="absolute inset-0"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
        >
          {nodes.map(node => {
            const scene = scenes.find(s => s.id === node.id);
            if (!scene) return null;
            const isActive = node.id === activeSceneId;
            return (
              <div
                key={node.id}
                className={`absolute select-none rounded-lg border cursor-pointer transition-shadow ${
                  isActive ? "border-gold-400/70 shadow-lg shadow-gold-400/10" : "border-gold-500/30 hover:border-gold-500/60"
                }`}
                style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onDoubleClick={() => loadScene(scene)}
                onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
              >
                {/* Background thumbnail */}
                <div className="w-full h-full bg-[#121212] relative flex items-center justify-center rounded-lg overflow-hidden">
                  {scene.bg
                    ? <img src={scene.bg} alt="" className="w-full h-full object-cover opacity-60" />
                    : <Map className="h-5 w-5 text-gold-800" />
                  }
                  <div className="absolute inset-0 bg-black/40" />
                  <p className="absolute bottom-1.5 left-2 right-2 text-gold-300 text-[10px] font-medium truncate">
                    {scene.name}
                  </p>
                  {isActive && (
                    <span className="absolute top-1 left-1.5 text-[8px] font-semibold uppercase tracking-wider bg-gold-400/90 text-black px-1 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>

                {/* Connection ports (outside the node bounds) */}
                {(["top", "right", "bottom", "left"] as Direction[]).map(dir => {
                  const hasConnection = !!node.connections[dir];
                  return (
                    <div
                      key={dir}
                      className={`absolute w-3 h-3 rounded-full border-2 transition-colors ${
                        hasConnection ? "bg-gold-400 border-gold-300 hover:bg-red-500 hover:border-red-400 cursor-pointer" : "bg-[#1a1a1a] border-gold-600/50 hover:border-gold-400"
                      }`}
                      style={{
                        left: PORT_OFFSETS[dir].x - PORT_RADIUS,
                        top: PORT_OFFSETS[dir].y - PORT_RADIUS,
                      }}
                      onMouseDown={(e) => handlePortMouseDown(e, node.id, dir)}
                      onMouseUp={(e) => handlePortMouseUp(e, node.id, dir)}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      title={hasConnection ? `Connected to: ${getSceneName(node.connections[dir]!)} (click to disconnect)` : `Drag to connect ${dir}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        </>)}

        {/* Context menu */}
        {contextMenu && (() => {
          const scene = scenes.find(s => s.id === contextMenu.nodeId);
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return null;
          const menuW = 192;
          const menuH = 40;
          const left = contextMenu.x + menuW > window.innerWidth ? contextMenu.x - menuW : contextMenu.x;
          const top = contextMenu.y + menuH > window.innerHeight ? contextMenu.y - menuH : contextMenu.y;
          return (
              <div
                ref={contextMenuRef}
                className="fixed z-50 w-48 bg-surface border border-gold-500 rounded-md text-gold-500 overflow-hidden"
                style={{ left, top }}
              >
                <div
                  className="px-4 py-2 hover:bg-gold-500/10 cursor-pointer transition-colors flex items-center gap-2"
                  onClick={() => { if (scene) editScene(scene); setContextMenu(null); }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Scene
                </div>
                <div
                  className="px-4 py-2 hover:bg-red-500/10 cursor-pointer transition-colors flex items-center gap-2 text-red-400 border-t border-gold-500/20"
                  onClick={() => { setPendingDelete(contextMenu.nodeId); setContextMenu(null); }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Scene
                </div>
              </div>
          );
        })()}

        {/* Delete confirmation modal */}
        {pendingDelete && (() => {
          const sceneName = getSceneName(pendingDelete);
          return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 p-6 w-80 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-red-400">
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <p className="font-semibold text-sm">Remove Scene</p>
                </div>
                <p className="text-gold-400 text-xs">
                  Remove <span className="font-semibold text-gold-200">"{sceneName}"</span> from this campaign? The scene will still be available in the search bar.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-3 py-1.5 text-xs text-gold-400 hover:text-gold-200 transition-colors"
                    onClick={() => setPendingDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1.5 text-xs text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    onClick={() => deleteScene(pendingDelete)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Empty state */}
        {scenesLoaded && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gold-700 text-xs text-center px-4">
              No scenes added yet. Add scenes to this campaign using the search bar.
            </p>
          </div>
        )}
      </div>

      {/* Interaction tips */}
      <div className="px-3 py-2 border-t border-gold-500/20 shrink-0 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <MousePointerClick className="h-3 w-3 text-gold-600" />
          <span className="text-gold-700 text-[9px]">Drag to move</span>
        </div>
        <div className="flex items-center gap-1">
          <MousePointerClick className="h-3 w-3 text-gold-600" />
          <span className="text-gold-700 text-[9px]">2x to open</span>
        </div>
        <div className="flex items-center gap-1">
          <Mouse className="h-3 w-3 text-gold-600" />
          <span className="text-gold-700 text-[9px]">Click port to disconnect</span>
        </div>
        <div className="flex items-center gap-1">
          <Mouse className="h-3 w-3 text-gold-600" />
          <span className="text-gold-700 text-[9px]">Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}


