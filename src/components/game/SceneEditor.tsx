import { useState, useEffect, useRef } from "react";
import HexSceneView from "./HexSceneView";
import { Grid2X2, Hexagon, ImagePlus, X } from "lucide-react";

export const DEFAULT_CELL_SIZE = 36;

export interface Scene {
  id: string;
  name: string;
  gridType: "hex" | "square";
  cols: number;
  rows: number;
  disabledCells: Set<string>;
  bg?: string;
  bgBounds?: { w: number; h: number };
  cellSize: number;
}

interface SceneEditorProps {
  scene: Scene;
  onChange: (scene: Scene) => void;
}

function computeDims(w: number, h: number, cs: number, gridType: "hex" | "square") {
  if (gridType === "square") {
    return {
      cols: Math.max(1, Math.ceil((w - cs) / (2 * cs))),
      rows: Math.max(1, Math.ceil((h - cs) / (2 * cs))),
    };
  }
  return {
    cols: Math.max(1, Math.ceil(w / (1.5 * cs) - 1)),
    rows: Math.max(1, Math.ceil((h / cs - 3) / Math.sqrt(3) + 0.5)),
  };
}

export default function SceneEditor({ scene, onChange }: SceneEditorProps) {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Synchronously compute cols/rows for any scene update that affects grid dimensions.
  // This prevents the two-render gap (cellSize change → cols/rows stale) that makes
  // the bg image jump before the grid catches up.
  const withDims = (cs: number, gt: "hex" | "square", bgB: { w: number; h: number } | undefined) => {
    const el = containerRef.current;
    const targetW = bgB?.w ?? el?.clientWidth ?? 0;
    const targetH = bgB?.h ?? el?.clientHeight ?? 0;
    return (targetW && targetH) ? computeDims(targetW, targetH, cs, gt) : { cols: scene.cols, rows: scene.rows };
  };

  const handleBgPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const s = sceneRef.current;
        const snapshot = { w: img.naturalWidth, h: img.naturalHeight };
        const dims = computeDims(snapshot.w, snapshot.h, s.cellSize, s.gridType);
        onChangeRef.current({ ...s, bg: dataUrl, bgBounds: snapshot, ...dims });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Initial sizing on mount and container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      const s = sceneRef.current;
      if (s.bgBounds) return;
      const { cols, rows } = computeDims(el.clientWidth, el.clientHeight, s.cellSize, s.gridType);
      if (cols !== s.cols || rows !== s.rows) onChangeRef.current({ ...s, cols, rows });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCellClick = (col: number, row: number, additive: boolean) => {
    const key = `${col},${row}`;
    if (additive) {
      const newSelected = new Set(selectedCells);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      setSelectedCells(newSelected);
    } else {
      if (selectedCells.size === 1 && selectedCells.has(key)) {
        setSelectedCells(new Set());
      } else {
        setSelectedCells(new Set([key]));
      }
    }
  };

  const handleCellsSelect = (cells: Set<string>) => {
    setSelectedCells(cells);
  };

  const toggleActive = () => {
    const newDisabled = new Set(scene.disabledCells);
    const allDisabled = [...selectedCells].every((k) => newDisabled.has(k));
    for (const key of selectedCells) {
      if (allDisabled) {
        newDisabled.delete(key);
      } else {
        newDisabled.add(key);
      }
    }
    onChange({ ...scene, disabledCells: newDisabled });
  };

  const allSelectedDisabled = selectedCells.size > 0 && [...selectedCells].every((k) => scene.disabledCells.has(k));

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgPick} />
      <HexSceneView
        scene={scene}
        selectedCells={selectedCells}
        onCellClick={handleCellClick}
        onCellsSelect={handleCellsSelect}
      />
      {/* Floating settings card – bottom right */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto flex flex-col gap-3 items-end">
        {selectedCells.size > 0 && (
          <div className="bg-surface border border-gold-500/40 rounded-xl p-3 min-w-48 shadow-xl">
            <span className="text-gold-500 text-sm font-medium">{selectedCells.size} cell{selectedCells.size > 1 ? "s" : ""} selected</span>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-gold-400 text-xs">Active</span>
                <button
                  onClick={toggleActive}
                  className={`w-9 h-5 rounded-full transition-colors cursor-pointer border border-gold-500 ${allSelectedDisabled ? "bg-transparent" : "bg-gold-800"}`}
                >
                  <div className={`w-3.5 h-3.5 bg-gold-500 rounded-full transition-transform mx-0.5 ${allSelectedDisabled ? "translate-x-0" : "translate-x-4"}`} />
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-surface border border-gold-500/40 rounded-xl shadow-xl w-64 flex flex-col divide-y divide-gold-500/20">
          {/* Grid section */}
          <div className="px-3 py-2 flex flex-col gap-1.5">
            <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">Grid</span>
            <div className="flex gap-1">
              <button
                className={`flex-1! flex items-center justify-center gap-1.5 h-8! text-xs! rounded-md! ${scene.gridType === "square" ? "bg-gold-500! text-gray-800!" : ""}`}
                onClick={() => onChange({ ...scene, gridType: "square", ...withDims(scene.cellSize, "square", scene.bgBounds) })}
              >
                <Grid2X2 size={14} /> Square
              </button>
              <button
                className={`flex-1! flex items-center justify-center gap-1.5 h-8! text-xs! rounded-md! ${scene.gridType === "hex" ? "bg-gold-500! text-gray-800!" : ""}`}
                onClick={() => onChange({ ...scene, gridType: "hex", ...withDims(scene.cellSize, "hex", scene.bgBounds) })}
              >
                <Hexagon size={14} /> Hex
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={12}
                max={80}
                step={1}
                value={scene.cellSize}
                onChange={(e) => { const cs = Number(e.target.value); onChange({ ...scene, cellSize: cs, ...withDims(cs, scene.gridType, scene.bgBounds) }); }}
                className="flex-1 accent-gold-500 cursor-pointer"
              />
              <span className="text-gold-500 text-xs font-medium w-10 text-right">{scene.cellSize}px</span>
            </div>
          </div>
          {/* BG section */}
          <div className="px-3 py-2 flex flex-col gap-1.5">
            <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">Background</span>
            <div className="flex gap-1">
              <button
                className="flex-1! h-8! text-xs! flex items-center justify-center gap-1.5 rounded-md!"
                onClick={() => bgInputRef.current?.click()}
              >
                <ImagePlus size={14} /> {scene.bg ? "Replace" : "Set"}
              </button>
              {scene.bg && (
                <button
                  className="flex-1! h-8! text-xs! flex items-center justify-center gap-1.5 rounded-md! text-red-300!"
                  onClick={() => onChange({ ...scene, bg: undefined, bgBounds: undefined, ...withDims(scene.cellSize, scene.gridType, undefined) })}
                >
                  <X size={14} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
