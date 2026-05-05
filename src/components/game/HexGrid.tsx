import { useEffect, useRef } from "react";

interface HexGridProps {
  cols?: number;
  rows?: number;
  cellSize?: number;
  gridType?: "hex" | "square";
  disabledCells?: Set<string>;
  selectedCells?: Set<string>;
  onCellClick?: (col: number, row: number) => void;
  editMode?: boolean;
  showToken?: boolean;
  bg?: string;
}

export default function HexGrid({ cols = 13, rows = 11, cellSize = 36, gridType = "hex", disabledCells, selectedCells, onCellClick, editMode = false, showToken = true, bg }: HexGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ disabledCells, selectedCells, onCellClick, editMode });
  propsRef.current = { disabledCells, selectedCells, onCellClick, editMode };
  const stateRef = useRef({
    camX: 0,
    camY: 0,
    zoom: 1,
    token: { col: 4, row: 4 },
    tokenPos: { x: 0, y: 0 },
    draggingToken: false,
    dragPos: { x: 0, y: 0 },
    dragHex: null as { col: number; row: number } | null,
    isPanning: false,
    panStart: { mx: 0, my: 0, cx: 0, cy: 0 },
    t0: performance.now(),
  });

  function cellCenter(col: number, row: number) {
    if (gridType === "square") {
      return {
        x: col * cellSize * 2 + cellSize,
        y: row * cellSize * 2 + cellSize,
      };
    }
    const w = cellSize * 2;
    const h = Math.sqrt(3) * cellSize;
    return {
      x: col * w * 0.75 + cellSize,
      y: row * h + (col % 2 === 1 ? h / 2 : 0) + cellSize,
    };
  }

  function pixelToCell(px: number, py: number) {
    let best: { col: number; row: number } | null = null;
    let bestD = Infinity;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const { x, y } = cellCenter(c, r);
        const d = Math.hypot(px - x, py - y);
        if (d < bestD) {
          bestD = d;
          best = { col: c, row: r };
        }
      }
    }
    return bestD < cellSize ? best : null;
  }

  function toWorld(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const s = stateRef.current;
    return {
      x: (clientX - rect.left - s.camX) / s.zoom,
      y: (clientY - rect.top - s.camY) / s.zoom,
    };
  }

  function isOverToken(wx: number, wy: number) {
    const s = stateRef.current;
    return Math.hypot(wx - s.tokenPos.x, wy - s.tokenPos.y) < cellSize * 0.65;
  }

  function applyZoom(clientX: number, clientY: number, factor: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const s = stateRef.current;
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const nz = Math.max(0.3, Math.min(4, s.zoom * factor));
    s.camX = mx - (mx - s.camX) * (nz / s.zoom);
    s.camY = my - (my - s.camY) * (nz / s.zoom);
    s.zoom = nz;
  }

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const DPR = window.devicePixelRatio || 1;
    const s = stateRef.current;

    // Initial token position
    const tc = cellCenter(s.token.col, s.token.row);
    s.tokenPos = { x: tc.x, y: tc.y };

    function resize() {
      const W = canvas.parentElement!.clientWidth;
      const H = canvas.parentElement!.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const last = cellCenter(cols - 1, rows - 1);
      s.camX = (W - last.x - cellSize) / 2;
      s.camY = (H - last.y - cellSize) / 2;
    }
    resize();

    function drawCellPath(cx: number, cy: number, r: number) {
      ctx.beginPath();
      if (gridType === "square") {
        ctx.rect(cx - r, cy - r, r * 2, r * 2);
      } else {
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          i === 0
            ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        ctx.closePath();
      }
    }

    function draw(now: number) {
      const t = (now - s.t0) / 1000;
      const W = canvas.parentElement!.clientWidth;
      const H = canvas.parentElement!.clientHeight;

      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.translate(s.camX, s.camY);
      ctx.scale(s.zoom, s.zoom);

      // Cell fills
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const { x, y } = cellCenter(c, r);
          const key = `${c},${r}`;
          const isDisabled = propsRef.current.disabledCells?.has(key);
          drawCellPath(x, y, cellSize + 0.5);
          if (isDisabled && propsRef.current.editMode) {
            ctx.fillStyle = "#0a0a0a";
            ctx.fill();
            ctx.strokeStyle = "rgba(255,50,50,0.2)";
            ctx.lineWidth = 1 / s.zoom;
            ctx.stroke();
          } else if (!isDisabled) {
            ctx.fillStyle = "#1a1a1a";
            ctx.fill();
          }
        }
      }

      // Drop highlight
      if (s.dragHex) {
        const dragKey = `${s.dragHex.col},${s.dragHex.row}`;
        const canDrop = !propsRef.current.disabledCells?.has(dragKey);
        const { x, y } = cellCenter(s.dragHex.col, s.dragHex.row);
        drawCellPath(x, y, cellSize + 0.5);
        ctx.fillStyle = canDrop ? "rgba(255,200,60,0.14)" : "rgba(153,27,27,0.3)";
        ctx.fill();
      }

      // Cell strokes
      ctx.strokeStyle = "rgba(255,255,255,0.11)";
      ctx.lineWidth = 1 / s.zoom;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const key = `${c},${r}`;
          const isDisabled = propsRef.current.disabledCells?.has(key);
          if (isDisabled && !propsRef.current.editMode) continue;
          const { x, y } = cellCenter(c, r);
          drawCellPath(x, y, cellSize);
          ctx.stroke();
        }
      }

      // Selected cells highlight
      if (propsRef.current.editMode && propsRef.current.selectedCells) {
        for (const key of propsRef.current.selectedCells) {
          const [c, r] = key.split(",").map(Number);
          const { x, y } = cellCenter(c, r);
          drawCellPath(x, y, cellSize + 0.5);
          ctx.fillStyle = "rgba(59,130,246,0.15)";
          ctx.fill();
          drawCellPath(x, y, cellSize);
          ctx.strokeStyle = "rgba(59,130,246,0.7)";
          ctx.lineWidth = 2 / s.zoom;
          ctx.stroke();
        }
      }

      // Drag cell border
      if (s.dragHex) {
        const dragKey = `${s.dragHex.col},${s.dragHex.row}`;
        const canDrop = !propsRef.current.disabledCells?.has(dragKey);
        const { x, y } = cellCenter(s.dragHex.col, s.dragHex.row);
        drawCellPath(x, y, cellSize);
        ctx.strokeStyle = canDrop ? "rgba(255,200,60,0.6)" : "rgba(153,27,27,0.8)";
        ctx.lineWidth = 1.5 / s.zoom;
        ctx.stroke();
      }

      if (!showToken) { ctx.restore(); animId = requestAnimationFrame(draw); return; }

      // Token
      const drawX = s.draggingToken ? s.dragPos.x : s.tokenPos.x;
      const drawY = s.draggingToken ? s.dragPos.y : s.tokenPos.y;
      const scale = s.draggingToken ? 1.15 : 1.0;

      // Ghost at target
      if (s.draggingToken && s.dragHex) {
        const { x, y } = cellCenter(s.dragHex.col, s.dragHex.row);
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(x, y, 17, 0, Math.PI * 2);
        ctx.fillStyle = "#c0392b";
        ctx.fill();
        ctx.restore();
      }

      // Shadow
      ctx.save();
      ctx.globalAlpha = s.draggingToken ? 0.1 : 0.32;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(drawX + 3, drawY + 8, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Token body
      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.scale(scale, scale);

      const pulse = 0.4 + Math.sin(t * 2.6) * 0.2;
      ctx.save();
      ctx.globalAlpha = s.draggingToken ? 1 : pulse;
      ctx.strokeStyle = "#ffd060";
      ctx.lineWidth = s.draggingToken ? 2.5 : 1.8;
      ctx.shadowColor = "#ffaa00";
      ctx.shadowBlur = s.draggingToken ? 16 : 8;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const g1 = ctx.createRadialGradient(-5, -5, 1, 0, 0, 18);
      g1.addColorStop(0, "#b07820");
      g1.addColorStop(1, "#5a3c08");
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fillStyle = g1;
      ctx.fill();

      const g2 = ctx.createRadialGradient(-4, -4, 1, 0, 0, 13);
      g2.addColorStop(0, "#e04444");
      g2.addColorStop(1, "#6a1010");
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fillStyle = g2;
      ctx.fill();

      ctx.strokeStyle = "#ffe090";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(5, 2);
      ctx.stroke();
      ctx.fillStyle = "#ffe090";
      ctx.beginPath();
      ctx.arc(0, 7, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(draw);
    }

    let animId = requestAnimationFrame(draw);

    // Input handlers
    function onMouseMove(e: MouseEvent) {
      const { x, y } = toWorld(e.clientX, e.clientY);
      if (s.draggingToken) {
        s.dragPos = { x, y };
        s.dragHex = pixelToCell(x, y);
        canvas.style.cursor = "grabbing";
        return;
      }
      if (s.isPanning) {
        s.camX = s.panStart.cx + (e.clientX - s.panStart.mx);
        s.camY = s.panStart.cy + (e.clientY - s.panStart.my);
        canvas.style.cursor = "grabbing";
        return;
      }
      canvas.style.cursor = showToken && isOverToken(x, y) ? "grab" : "default";
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button === 1) {
        e.preventDefault();
        s.isPanning = true;
        s.panStart = { mx: e.clientX, my: e.clientY, cx: s.camX, cy: s.camY };
        canvas.style.cursor = "grabbing";
        return;
      }
      if (e.button !== 0) return;
      const { x, y } = toWorld(e.clientX, e.clientY);
      if (propsRef.current.editMode) {
        const cell = pixelToCell(x, y);
        if (cell && propsRef.current.onCellClick) {
          propsRef.current.onCellClick(cell.col, cell.row);
          e.preventDefault();
          return;
        }
      }
      if (showToken && isOverToken(x, y)) {
        s.draggingToken = true;
        s.dragPos = { x, y };
        s.dragHex = pixelToCell(x, y);
      } else {
        s.isPanning = true;
        s.panStart = { mx: e.clientX, my: e.clientY, cx: s.camX, cy: s.camY };
      }
      canvas.style.cursor = "grabbing";
      e.preventDefault();
    }

    function onMouseUp(e: MouseEvent) {
      if (e.button === 1) {
        s.isPanning = false;
        canvas.style.cursor = "default";
        return;
      }
      if (e.button !== 0) return;
      if (s.draggingToken) {
        if (s.dragHex) {
          const key = `${s.dragHex.col},${s.dragHex.row}`;
          if (!propsRef.current.disabledCells?.has(key)) {
            s.token = s.dragHex;
            s.tokenPos = { ...cellCenter(s.dragHex.col, s.dragHex.row) };
          }
        }
        s.draggingToken = false;
        s.dragHex = null;
      }
      s.isPanning = false;
      canvas.style.cursor = "default";
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.ctrlKey) {
        const factor = 1 - e.deltaY * 0.01;
        applyZoom(e.clientX, e.clientY, factor);
      } else {
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 16;
        if (e.deltaMode === 2) delta *= 400;
        const factor = Math.pow(0.999, delta);
        applyZoom(e.clientX, e.clientY, factor);
      }
    }

    function onContextMenu(e: Event) {
      e.preventDefault();
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("resize", resize);
    };
  }, [cols, rows, cellSize, gridType, showToken]);

  return (
    <div className="w-full h-full overflow-hidden rounded-xl">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
