import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import type { Scene } from "./SceneEditor";
import { cellCenter, gridBounds } from "./HexSceneView";
import type { Character } from "../../pages/character/character-editor";
import type { Token } from "../../pages/play/Play";

function cellPoints(cx: number, cy: number, r: number, gridType: "hex" | "square" | "none"): string {
  if (gridType === "square" || gridType === "none") {
    return `${cx - r},${cy - r} ${cx + r},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`;
  }
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

interface PlayCanvasProps {
  scene: Scene;
  tokens?: Token[];
  onDropCharacter?: (character: Character, col: number, row: number) => void;
  onMoveToken?: (tokenId: string, col: number, row: number) => void;
}

const PlayCanvas = forwardRef<HTMLDivElement, PlayCanvasProps>(function PlayCanvas({ scene, tokens = [], onDropCharacter, onMoveToken }, ref) {
  const { cols, rows, gridType, disabledCells } = scene;
  const cs = scene.cellSize;
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => containerRef.current!, []);
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
  }, [scene.id, gridType, hasBg]);

  // Center on character when pinned in PlayersDisplay (smooth animation)
  useEffect(() => {
    let animFrame: number | null = null;
    const handler = (e: Event) => {
      const character = (e as CustomEvent).detail;
      if (!character?.id) return;
      const token = tokens.find(t => t.characterId === character.id);
      if (!token) return;
      const el = containerRef.current;
      if (!el) return;
      const gf = gridFitRef.current;
      const tx = gridType === "none" ? token.col : cellCenter(token.col, token.row, gridType, cs).x;
      const ty = gridType === "none" ? token.row : cellCenter(token.col, token.row, gridType, cs).y;
      const cam = camRef.current;

      // Fixed target zoom level (always the same regardless of current zoom)
      const clampedZoom = 1.8;

      const targetX = el.clientWidth / 2 - tx * gf * clampedZoom;
      const targetY = el.clientHeight / 2 - ty * gf * clampedZoom;

      const startX = cam.x;
      const startY = cam.y;
      const startZoom = cam.zoom;
      const duration = 500;
      const startTime = performance.now();

      if (animFrame) cancelAnimationFrame(animFrame);

      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);
        camRef.current = {
          x: startX + (targetX - startX) * ease,
          y: startY + (targetY - startY) * ease,
          zoom: startZoom + (clampedZoom - startZoom) * ease,
        };
        applyTransform();
        if (t < 1) {
          animFrame = requestAnimationFrame(animate);
        }
      };
      animFrame = requestAnimationFrame(animate);
    };
    window.addEventListener("center-on-character", handler);
    return () => {
      window.removeEventListener("center-on-character", handler);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [tokens, gridType, cs]);

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

  // Token dragging state (declared early so cells can reference highlight state)
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOriginCell, setDragOriginCell] = useState<{ col: number; row: number } | null>(null);
  const [dragHoverCell, setDragHoverCell] = useState<{ col: number; row: number } | null>(null);

  // Render cells (read-only, no selection)
  const hexBleed = scene.bg && gridType === "hex";
  const rMin = hexBleed ? -1 : 0;
  const rMax = hexBleed ? rows : rows - 1;
  const cMin = hexBleed ? -1 : 0;
  const cMax = hexBleed ? cols : cols - 1;

  const cells: React.ReactNode[] = [];
  if (gridType !== "none") {
    for (let c = cMin; c <= cMax; c++) {
      for (let r = rMin; r <= rMax; r++) {
        const key = `${c},${r}`;
        const { x, y } = cellCenter(c, r, gridType, cs);
        const isDisabled = disabledCells.has(key);
        const isOrigin = dragOriginCell?.col === c && dragOriginCell?.row === r;
        const isHover = dragHoverCell?.col === c && dragHoverCell?.row === r && !isOrigin;
        let stroke = isDisabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.11)";
        if (isOrigin) stroke = "rgba(212,175,55,0.6)";
        if (isHover) stroke = "rgba(212,175,55,0.9)";
        cells.push(
          <polygon
            key={key}
            points={cellPoints(x, y, cs, gridType)}
            fill="transparent"
            stroke={stroke}
            strokeWidth={isOrigin || isHover ? 2 / gridFit : 1 / gridFit}
          />
        );
      }
    }
  }

  // Find the grid cell under a screen point
  const cellAtPoint = useCallback((clientX: number, clientY: number): { col: number; row: number } | null => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cam = camRef.current;
    const gf = gridFitRef.current;
    // Convert screen coords to SVG grid coords
    const svgX = ((clientX - rect.left) - cam.x) / cam.zoom / gf;
    const svgY = ((clientY - rect.top) - cam.y) / cam.zoom / gf;

    if (scene.gridType === "none") {
      // Free mode: return pixel coords directly
      return { col: Math.round(svgX), row: Math.round(svgY) };
    }

    const { cols: maxC, rows: maxR, gridType: gt, cellSize: cellS } = scene;
    let bestCol = 0, bestRow = 0, bestDist = Infinity;
    for (let c = 0; c < maxC; c++) {
      for (let r = 0; r < maxR; r++) {
        const { x, y } = cellCenter(c, r, gt, cellS);
        const d = (x - svgX) ** 2 + (y - svgY) ** 2;
        if (d < bestDist) { bestDist = d; bestCol = c; bestRow = r; }
      }
    }
    return { col: bestCol, row: bestRow };
  }, [scene]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const cell = cellAtPoint(e.clientX, e.clientY);
    if (!cell) return;

    try {
      const parsed = JSON.parse(data);
      if (parsed.id && onDropCharacter) {
        onDropCharacter(parsed as Character, cell.col, cell.row);
      }
    } catch { /* ignore */ }
  };

  // Token dragging via mouse events (not HTML5 drag-and-drop)
  const onTokenMouseDown = (e: React.MouseEvent, token: Token) => {
    if (e.button !== 0) return; // left click only
    e.stopPropagation();
    e.preventDefault();
    setDraggingTokenId(token.id);
    setDragOriginCell({ col: token.col, row: token.row });
    setDragHoverCell({ col: token.col, row: token.row });

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cam = camRef.current;
    const gf = gridFitRef.current;
    // Convert to grid-space for initial position
    const toGrid = (cx: number, cy: number) => ({
      x: ((cx - rect.left) - cam.x) / cam.zoom / gf,
      y: ((cy - rect.top) - cam.y) / cam.zoom / gf,
    });

    setDragPos(toGrid(e.clientX, e.clientY));

    const onMove = (ev: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const c = camRef.current;
      const g = gridFitRef.current;
      setDragPos({
        x: ((ev.clientX - r.left) - c.x) / c.zoom / g,
        y: ((ev.clientY - r.top) - c.y) / c.zoom / g,
      });
      const hover = cellAtPoint(ev.clientX, ev.clientY);
      if (hover) setDragHoverCell(hover);
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const cell = cellAtPoint(ev.clientX, ev.clientY);
      if (cell && onMoveToken) {
        onMoveToken(token.id, cell.col, cell.row);
      }
      setDraggingTokenId(null);
      setDragPos(null);
      setDragOriginCell(null);
      setDragHoverCell(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Render tokens
  const tokenElements = tokens.map(token => {
    const isDragging = draggingTokenId === token.id;
    const cellX = gridType === "none" ? token.col : cellCenter(token.col, token.row, gridType, cs).x;
    const cellY = gridType === "none" ? token.row : cellCenter(token.col, token.row, gridType, cs).y;
    const x = isDragging && dragPos ? dragPos.x : cellX;
    const y = isDragging && dragPos ? dragPos.y : cellY;
    const tokenRadius = cs * 0.75;
    const clipId = `token-clip-${token.id}`;
    return (
      <g key={token.id} style={{ opacity: isDragging ? 0.8 : 1, cursor: "grab" }}>
        <defs>
          <clipPath id={clipId}>
            <circle cx={x} cy={y} r={tokenRadius} />
          </clipPath>
        </defs>
        {token.image ? (
          <image
            href={token.image}
            x={x - tokenRadius}
            y={y - tokenRadius}
            width={tokenRadius * 2}
            height={tokenRadius * 2}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <circle cx={x} cy={y} r={tokenRadius} fill="rgba(180,130,50,0.6)" />
        )}
        <circle
          cx={x} cy={y} r={tokenRadius}
          fill="transparent"
          stroke="rgba(212,175,55,0.8)"
          strokeWidth={2 / gridFit}
        />
        {/* Interaction area */}
        <circle
          cx={x} cy={y} r={tokenRadius}
          fill="transparent"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={(e) => onTokenMouseDown(e, token)}
        />
      </g>
    );
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      onMouseDown={onMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={onDragOver}
      onDrop={onDrop}
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
            {tokenElements}
          </g>
        </g>
      </svg>
    </div>
  );
});

export default PlayCanvas;
