import { useRef, useState, useEffect } from "react";
import type { Scene } from "./SceneEditor";
import { cellCenter, gridBounds } from "./HexSceneView";

function cellPoints(cx: number, cy: number, r: number, gridType: "hex" | "square"): string {
  if (gridType === "square") {
    return `${cx - r},${cy - r} ${cx + r},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`;
  }
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

interface PlayCanvasProps {
  scene: Scene;
}

export default function PlayCanvas({ scene }: PlayCanvasProps) {
  const { cols, rows, gridType, disabledCells } = scene;
  const cs = scene.cellSize;
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<SVGGElement>(null);
  const camRef = useRef({ x: 0, y: 0, zoom: 1 });
  const gridFitRef = useRef(1);
  const [panning, setPanning] = useState(false);

  const applyTransform = () => {
    const g = transformRef.current;
    if (g) {
      const { x, y, zoom } = camRef.current;
      g.setAttribute("transform", `translate(${x}, ${y}) scale(${zoom})`);
    }
  };

  const naturalBounds = gridBounds(scene);
  const cellCoverW = naturalBounds.w - cs;
  const cellCoverH = naturalBounds.h - cs;
  const gridFit = scene.bgBounds
    ? Math.max(scene.bgBounds.w / cellCoverW, scene.bgBounds.h / cellCoverH)
    : 1;
  gridFitRef.current = gridFit;
  const naturalBoundsRef = useRef(naturalBounds);
  naturalBoundsRef.current = naturalBounds;
  const bgBoundsRef = useRef(scene.bgBounds);
  bgBoundsRef.current = scene.bgBounds;

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

  // Zoom with scroll wheel
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
      const nb = naturalBoundsRef.current;
      const gf = gridFitRef.current;
      const bgB = bgBoundsRef.current;
      const contentW = bgB ? bgB.w : nb.w * gf;
      const contentH = bgB ? bgB.h : nb.h * gf;
      const minZoom = Math.min(el.clientWidth / contentW, el.clientHeight / contentH) * 0.85;
      const nz = Math.max(minZoom, Math.min(4, c.zoom * factor));
      camRef.current = { x: mx - (mx - c.x) * (nz / c.zoom), y: my - (my - c.y) * (nz / c.zoom), zoom: nz };
      applyTransform();
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Pan with middle mouse button
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
    }
  };

  // Render cells (read-only, no selection)
  const hexBleed = scene.bg && gridType === "hex";
  const rMin = hexBleed ? -1 : 0;
  const rMax = hexBleed ? rows : rows - 1;
  const cMin = hexBleed ? -1 : 0;
  const cMax = hexBleed ? cols : cols - 1;

  const cells: React.ReactNode[] = [];
  for (let c = cMin; c <= cMax; c++) {
    for (let r = rMin; r <= rMax; r++) {
      const key = `${c},${r}`;
      const { x, y } = cellCenter(c, r, gridType, cs);
      const isDisabled = disabledCells.has(key);
      cells.push(
        <polygon
          key={key}
          points={cellPoints(x, y, cs, gridType)}
          fill="transparent"
          stroke={isDisabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.11)"}
          strokeWidth={1 / gridFit}
        />
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      onMouseDown={onMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor: panning ? "grabbing" : "default" }}
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
      </svg>
    </div>
  );
}
