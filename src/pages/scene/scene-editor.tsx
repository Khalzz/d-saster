import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import SceneEditorCanvas, { Scene, DEFAULT_CELL_SIZE } from "../../components/game/SceneEditor";
import Button from "../../components/ui/buttons/BaseButton";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

interface ExistingScene {
  id: string;
  name: string;
  gridType: string;
  cols: number;
  rows: number;
  disabledCells: string[];
  bg?: string;
  bgBounds?: { w: number; h: number };
  cellSize?: number;
}

export default function SceneEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { name?: string; existing?: ExistingScene } | null;

  const [scene, setScene] = useState<Scene>(() => {
    if (state?.existing) {
      const e = state.existing;
      return {
        id: e.id,
        name: e.name,
        gridType: e.gridType as "hex" | "square",
        cols: e.cols,
        rows: e.rows,
        disabledCells: new Set(e.disabledCells),
        bg: e.bg,
        bgBounds: e.bgBounds,
        cellSize: e.cellSize ?? DEFAULT_CELL_SIZE,
      };
    }
    return {
      id: crypto.randomUUID(),
      name: state?.name || "Unnamed Scene",
      gridType: "hex",
      cols: 13,
      rows: 11,
      disabledCells: new Set(),
      cellSize: DEFAULT_CELL_SIZE,
    };
  });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(scene.name);

  const commitName = (value: string) => {
    const trimmed = value.trim() || scene.name;
    setScene(s => ({ ...s, name: trimmed }));
    setNameInput(trimmed);
    setEditingName(false);
  };

  const handleSave = () => {
    invoke("save_scene", {
      scene: {
        id: scene.id,
        name: scene.name,
        gridType: scene.gridType,
        cols: scene.cols,
        rows: scene.rows,
        disabledCells: [...scene.disabledCells],
        bg: scene.bg,
        bgBounds: scene.bgBounds,
        cellSize: scene.cellSize,
      },
    });
    toast("Saved")
  };

  return (
    <main className="h-full min-w-screen bg-base flex justify-center items-center relative">
      <SceneEditorCanvas scene={scene} onChange={setScene} onSave={handleSave} />
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        <Button className="text-sm flex items-center justify-center w-10! h-10!" onClick={() => navigate("/play")}>
          <ChevronLeft />
        </Button>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-gold-500 text-gold-900 px-2 rounded-b-md">
        {editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={(e) => commitName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setNameInput(scene.name); setEditingName(false); } }}
            className="bg-transparent! border-none! shadow-none! px-0! py-0! outline-none! text-gold-900! text-center font-normal! w-auto min-w-8"
            style={{ width: `${nameInput.length + 1}ch` }}
          />
        ) : (
          <span className="cursor-text px-2" onClick={() => { setNameInput(scene.name); setEditingName(true); }}>
            {scene.name}
          </span>
        )}
      </div>
    </main>
  );
}