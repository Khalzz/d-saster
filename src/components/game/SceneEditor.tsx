import { useState, useEffect, useRef } from "react";
import HexSceneView from "./HexSceneView";
import Button from "../ui/buttons/BaseButton";
import { Grid2X2, Hexagon, ImagePlus, Save, X } from "lucide-react";

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
  onSave?: () => void;
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

export default function SceneEditor({ scene, onChange, onSave }: SceneEditorProps) {
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

  const handleCellClick = (col: number, row: number) => {
    const key = `${col},${row}`;
    const newSelected = new Set(selectedCells);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCells(newSelected);
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 pointer-events-auto">
        <div className="flex flex-row gap-3 items-center bg-surface border border-gold-500/40 rounded-xl px-5 py-3 shadow-xl">
          <Button
            className={`flex items-center gap-2 px-4! h-11! text-sm ${scene.gridType === "square" ? "bg-gold-500! text-gray-800!" : ""}`}
            onClick={() => onChange({ ...scene, gridType: "square", ...withDims(scene.cellSize, "square", scene.bgBounds) })}
          >
            <Grid2X2 size={18} /> Square
          </Button>
          <Button
            className={`flex items-center gap-2 px-4! h-11! text-sm ${scene.gridType === "hex" ? "bg-gold-500! text-gray-800!" : ""}`}
            onClick={() => onChange({ ...scene, gridType: "hex", ...withDims(scene.cellSize, "hex", scene.bgBounds) })}
          >
            <Hexagon size={18} /> Hex
          </Button>
          <div className="w-px h-6 bg-gold-500/20" />
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={12}
              max={80}
              step={1}
              value={scene.cellSize}
              onChange={(e) => { const cs = Number(e.target.value); onChange({ ...scene, cellSize: cs, ...withDims(cs, scene.gridType, scene.bgBounds) }); }}
              className="w-36 accent-gold-500 cursor-pointer"
            />
            <span className="text-gold-500 text-sm font-medium w-12 text-center">{scene.cellSize}px</span>
          </div>
          <div className="w-px h-6 bg-gold-500/20" />
          <Button className="h-11! w-11! flex items-center justify-center" onClick={() => bgInputRef.current?.click()}>
            <ImagePlus size={18} />
          </Button>
          {scene.bg && (
            <Button className="h-11! w-11! flex items-center justify-center" onClick={() => onChange({ ...scene, bg: undefined, bgBounds: undefined, ...withDims(scene.cellSize, scene.gridType, undefined) })}>
              <X size={18} />
            </Button>
          )}
          <Button className="h-11! w-11! flex items-center justify-center" onClick={onSave}>
            <Save size={18} />
          </Button>
        </div>
        {selectedCells.size > 0 && (
          <div className="z-20 pointer-events-auto bg-surface border border-gold-500 rounded-md p-3 min-w-48">
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
      </div>
    </div>
  );
}
