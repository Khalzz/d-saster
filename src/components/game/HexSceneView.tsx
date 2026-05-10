import { useRef, useState, useEffect } from "react";
import type { Scene } from "./SceneEditor";

export const CELL_SIZE = 36;

export function cellCenter(col: number, row: number, gridType: "hex" | "square", cs = CELL_SIZE) {
  if (gridType === "square") {
    return { x: col * cs * 2 + cs, y: row * cs * 2 + cs };
  }
  const w = cs * 2;
  const h = Math.sqrt(3) * cs;
  return {
    x: col * w * 0.75 + cs,
    y: row * h + (Math.abs(col % 2) === 1 ? h / 2 : 0) + cs,
  };
}

function cellPoints(cx: number, cy: number, r: number, gridType: "hex" | "square"): string {
  if (gridType === "square") {
    return `${cx - r},${cy - r} ${cx + r},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`;
  }
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

export function gridBounds(scene: Scene) {
  const cs = scene.cellSize;
  let maxX = 0, maxY = 0;
  for (let c = 0; c < scene.cols; c++) {
    for (let r = 0; r < scene.rows; r++) {
      const { x, y } = cellCenter(c, r, scene.gridType, cs);
      if (x + cs > maxX) maxX = x + cs;
      if (y + cs > maxY) maxY = y + cs;
    }
  }
  return { w: maxX + cs, h: maxY + cs };
}

interface HexSceneViewProps {
  scene: Scene;
  selectedCells?: Set<string>;
  onCellClick?: (col: number, row: number, additive: boolean) => void;
  onCellsSelect?: (cells: Set<string>) => void;
}

export default function HexSceneView({ scene, selectedCells, onCellClick, onCellsSelect }: HexSceneViewProps) {
  const { cols, rows, gridType, disabledCells } = scene;
  const cs = scene.cellSize;
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<SVGGElement>(null);
  const camRef = useRef({ x: 0, y: 0, zoom: 1 });
  const gridFitRef = useRef(1);
  const lmbRef = useRef<{ cx: number; cy: number; dragging: boolean } | null>(null);
  const [panning, setPanning] = useState(false);
  const [rubberBand, setRubberBand] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const applyTransform = () => {
    const g = transformRef.current;
    if (g) {
      const { x, y, zoom } = camRef.current;
      g.setAttribute("transform", `translate(${x}, ${y}) scale(${zoom})`);
    }
  };

  const naturalBounds = gridBounds(scene);
  // Cell coverage excludes the cs-wide margin gridBounds adds beyond the last cell edge.
  const cellCoverW = naturalBounds.w - cs;
  const cellCoverH = naturalBounds.h - cs;
  const gridFit = scene.bgBounds
    ? Math.max(scene.bgBounds.w / cellCoverW, scene.bgBounds.h / cellCoverH)
    : 1;
  gridFitRef.current = gridFit;

  const hasBg = !!scene.bgBounds;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (scene.bgBounds) {
      const nb = gridBounds(scene);
      const cw = nb.w - cs, ch = nb.h - cs;
      const fit = Math.max(scene.bgBounds.w / cw, scene.bgBounds.h / ch);
      const zoom = Math.min(el.clientWidth / (cw * fit), el.clientHeight / (ch * fit)) * 0.85;
      const scaledW = cw * fit * zoom;
      const scaledH = ch * fit * zoom;
      camRef.current = { x: (el.clientWidth - scaledW) / 2, y: (el.clientHeight - scaledH) / 2, zoom };
    } else {
      camRef.current = { x: 0, y: 0, zoom: 1 };
    }
    applyTransform();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridType, hasBg]);

  const screenToWorld = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const c = camRef.current;
    const fit = gridFitRef.current;
    return { x: (clientX - rect.left - c.x) / c.zoom / fit, y: (clientY - rect.top - c.y) / c.zoom / fit };
  };

  const hexBleed = scene.bg && gridType === "hex";
  const rMin = hexBleed ? -1 : 0;
  const rMax = hexBleed ? rows : rows - 1;
  const cMin = hexBleed ? -1 : 0;
  const cMax = hexBleed ? cols : cols - 1;

  const cellAtPoint = (wx: number, wy: number) => {
    let best: { col: number; row: number } | null = null;
    let bestD = Infinity;
    for (let c = cMin; c <= cMax; c++) {
      for (let r = rMin; r <= rMax; r++) {
        const { x, y } = cellCenter(c, r, gridType, cs);
        const d = Math.hypot(wx - x, wy - y);
        if (d < bestD) { bestD = d; best = { col: c, row: r }; }
      }
    }
    return bestD < cs ? best : null;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = e.deltaY * (e.deltaMode === 2 ? 400 : e.deltaMode === 1 ? 16 : 1);
      const factor = e.ctrlKey ? Math.pow(0.99, e.deltaY) : Math.pow(0.999, delta);
      const c = camRef.current;
      const nz = Math.max(0.3, Math.min(4, c.zoom * factor));
      camRef.current = { x: mx - (mx - c.x) * (nz / c.zoom), y: my - (my - c.y) * (nz / c.zoom), zoom: nz };
      applyTransform();
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      const startMx = e.clientX;
      const startMy = e.clientY;
      const startCx = camRef.current.x;
      const startCy = camRef.current.y;
      setPanning(true);

      const onWindowMove = (ev: MouseEvent) => {
        camRef.current = {
          ...camRef.current,
          x: startCx + (ev.clientX - startMx),
          y: startCy + (ev.clientY - startMy),
        };
        applyTransform();
      };
      const onWindowUp = () => {
        setPanning(false);
        window.removeEventListener("mousemove", onWindowMove);
        window.removeEventListener("mouseup", onWindowUp);
      };
      window.addEventListener("mousemove", onWindowMove);
      window.addEventListener("mouseup", onWindowUp);
      return;
    }
    if (e.button === 0) {
      lmbRef.current = { cx: e.clientX, cy: e.clientY, dragging: false };
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!lmbRef.current || !(e.buttons & 1)) return;
    if (!lmbRef.current.dragging) {
      const dx = e.clientX - lmbRef.current.cx;
      const dy = e.clientY - lmbRef.current.cy;
      if (Math.hypot(dx, dy) < 4) return;
      lmbRef.current.dragging = true;
    }
    const rect = containerRef.current!.getBoundingClientRect();
    setRubberBand({
      x1: lmbRef.current.cx - rect.left,
      y1: lmbRef.current.cy - rect.top,
      x2: e.clientX - rect.left,
      y2: e.clientY - rect.top,
    });
  };

  const onMouseUp = (e: React.MouseEvent) => {
    setRubberBand(null);
    const lmb = lmbRef.current;
    lmbRef.current = null;
    if (!lmb) return;

    if (lmb.dragging) {
      const rect = containerRef.current!.getBoundingClientRect();
      const startSx = lmb.cx - rect.left;
      const startSy = lmb.cy - rect.top;
      const endSx = e.clientX - rect.left;
      const endSy = e.clientY - rect.top;
      const toWorld = (sx: number, sy: number) => {
        const c = camRef.current;
        const fit = gridFitRef.current;
        return { x: (sx - c.x) / c.zoom / fit, y: (sy - c.y) / c.zoom / fit };
      };
      const wMin = toWorld(Math.min(startSx, endSx), Math.min(startSy, endSy));
      const wMax = toWorld(Math.max(startSx, endSx), Math.max(startSy, endSy));
      const newSelected = new Set<string>();
      for (let col = cMin; col <= cMax; col++) {
        for (let row = rMin; row <= rMax; row++) {
          const { x, y } = cellCenter(col, row, gridType, cs);
          if (x + cs > wMin.x && x - cs < wMax.x && y + cs > wMin.y && y - cs < wMax.y) {
            newSelected.add(`${col},${row}`);
          }
        }
      }
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      if (additive && selectedCells) {
        const merged = new Set(selectedCells);
        for (const key of newSelected) merged.add(key);
        onCellsSelect?.(merged);
      } else {
        onCellsSelect?.(newSelected);
      }
    } else {
      const { x, y } = screenToWorld(lmb.cx, lmb.cy);
      const cell = cellAtPoint(x, y);
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      if (cell) {
        onCellClick?.(cell.col, cell.row, additive);
      } else if (!additive) {
        onCellsSelect?.(new Set());
      }
    }
  };

  const onMouseLeave = () => {
    lmbRef.current = null;
    setRubberBand(null);
  };

  const cells: React.ReactNode[] = [];
  for (let c = cMin; c <= cMax; c++) {
    for (let r = rMin; r <= rMax; r++) {
      const key = `${c},${r}`;
      const { x, y } = cellCenter(c, r, gridType, cs);
      const isDisabled = disabledCells.has(key);
      const isSelected = selectedCells?.has(key);
      const baseFill = scene.bg ? (isDisabled ? "transparent" : "rgba(26,26,26,0.55)") : (isDisabled ? "transparent" : "#1a1a1a");
      cells.push(
        <polygon
          key={key}
          points={cellPoints(x, y, cs, gridType)}
          fill={isSelected ? (isDisabled ? "rgba(153,27,27,0.15)" : "rgba(59,130,246,0.15)") : baseFill}
          stroke={isSelected ? (isDisabled ? "rgba(153,27,27,0.5)" : "rgba(59,130,246,0.7)") : isDisabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.11)"}
          strokeWidth={isSelected ? 2 / gridFit : 1 / gridFit}
          style={{ cursor: "pointer" }}
        />
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor: "default" }}
    >
      <svg width="100%" height="100%">
        <g ref={transformRef}>
          <g transform={`scale(${gridFit})`}>
            {scene.bg && (
              <image
                href={scene.bg}
                x={scene.bgBounds ? (cellCoverW - scene.bgBounds.w / gridFit) / 2 : 0}
                y={scene.bgBounds ? (cellCoverH - scene.bgBounds.h / gridFit) / 2 : 0}
                width={scene.bgBounds ? scene.bgBounds.w / gridFit : cellCoverW}
                height={scene.bgBounds ? scene.bgBounds.h / gridFit : cellCoverH}
                preserveAspectRatio="none"
              />
            )}
            {cells}
          </g>
        </g>
        {rubberBand && (
          <rect
            x={Math.min(rubberBand.x1, rubberBand.x2)}
            y={Math.min(rubberBand.y1, rubberBand.y2)}
            width={Math.max(2, Math.abs(rubberBand.x2 - rubberBand.x1))}
            height={Math.max(2, Math.abs(rubberBand.y2 - rubberBand.y1))}
            fill="rgba(59,130,246,0.1)"
            stroke="rgba(59,130,246,0.8)"
            strokeWidth={1}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
        )}
      </svg>
      {panning && <div className="absolute inset-0" style={{ cursor: "grabbing" }} />}
    </div>
  );
}
