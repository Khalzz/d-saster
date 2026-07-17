import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import * as THREE from "three";
import type { Scene } from "./SceneEditor";

interface Token3D {
  id: string;
  characterId: string;
  name: string;
  image?: string;
  col: number;
  row: number;
  scale?: number;
}

interface Props {
  scene: Scene;
  tokens?: Token3D[];
  onMoveToken?: (tokenId: string, col: number, row: number) => void;
  onResizeToken?: (tokenId: string, scale: number) => void;
}

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;

// Arbitrary world-space size for the board's longer edge; the plane keeps
// the image's real aspect ratio within that footprint.
const WORLD_SIZE = 10;
const TOKEN_BORDER_COLOR = "#ddb84e";
// Token look: a flat ring marking the token's ground position, with a
// camera-facing portrait card floating above it (disconnected from the
// ring — no physical base connecting them).
const GROUND_RADIUS = 0.16;
const GROUND_RING_WIDTH = 0.035;
const FLOAT_HEIGHT = 0.1;
const STANDEE_HEIGHT = 0.40;
const STANDEE_BORDER = 0.02;
const STANDEE_FALLBACK_ASPECT = 0.7;
// Scales the card's width down relative to its height so it reads as a
// slim standee rather than a wide flat panel.
const STANDEE_WIDTH_SCALE = 0.55;
// Big invisible plane tokens are dragged across — much larger than any
// board so a fast drag never outruns it.
const DRAG_PLANE_SIZE = 200;
// How quickly a token's visual position catches up to its target each frame
// (0-1, higher = snappier/less smoothing).
const TOKEN_LERP_FACTOR = 0.25;
// While a token is being dragged: the card lifts a bit higher, and the
// ground ring collapses down to a small filled dot.
const DRAG_LIFT = 0.18;
const DRAG_GROUND_RADIUS = 0.06;
// Hover feedback: the whole token pops up slightly larger, and the ground
// ring brightens.
const HOVER_SCALE_BOOST = 1.12;
const HOVER_RING_COLOR = "#f5dd8f";

function boardSize(bgBounds?: { w: number; h: number }) {
  const aspect = bgBounds && bgBounds.h > 0 ? bgBounds.w / bgBounds.h : 1;
  const width = aspect >= 1 ? WORLD_SIZE : WORLD_SIZE * aspect;
  const height = aspect >= 1 ? WORLD_SIZE / aspect : WORLD_SIZE;
  return { width, height };
}

// world (x, z) -> token (col, row), inverse of the mapping in TokenMarker
function worldToGrid(x: number, z: number, scene: Scene, width: number, height: number) {
  const nx = x / width + 0.5;
  const nz = z / height + 0.5;
  if (scene.gridType === "none") {
    const w = scene.bgBounds?.w || 1;
    const h = scene.bgBounds?.h || 1;
    return {
      col: Math.round(Math.min(Math.max(nx, 0), 1) * w),
      row: Math.round(Math.min(Math.max(nz, 0), 1) * h),
    };
  }
  const cols = scene.cols || 1;
  const rows = scene.rows || 1;
  return {
    col: Math.min(Math.max(Math.floor(nx * cols), 0), cols - 1),
    row: Math.min(Math.max(Math.floor(nz * rows), 0), rows - 1),
  };
}

// token (col, row) -> world (x, z)
function gridToWorld(token: Token3D, scene: Scene, width: number, height: number) {
  let nx: number;
  let nz: number;
  if (scene.gridType === "none") {
    nx = token.col / (scene.bgBounds?.w || 1);
    nz = token.row / (scene.bgBounds?.h || 1);
  } else {
    nx = (token.col + 0.5) / (scene.cols || 1);
    nz = (token.row + 0.5) / (scene.rows || 1);
  }
  return { x: (nx - 0.5) * width, z: (nz - 0.5) * height };
}

// Smoothly pulls the OrbitControls target (and zooms the camera in) toward
// a world (x, z) point set externally via focusRef — driven by a ref rather
// than React state since it's triggered by a plain window CustomEvent
// (clicking a portrait in the bottom-left party bar), not a render.
const FOCUS_DISTANCE = 4;
function CameraFocus({
  controlsRef, focusRef,
}: {
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>;
  focusRef: React.RefObject<{ x: number; z: number } | null>;
}) {
  useFrame(({ camera }) => {
    const controls = controlsRef.current;
    const focus = focusRef.current;
    if (!controls || !focus) return;

    const targetVec = new THREE.Vector3(focus.x, controls.target.y, focus.z);
    controls.target.lerp(targetVec, 0.12);

    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    const currentDistance = camera.position.distanceTo(controls.target);
    const newDistance = THREE.MathUtils.lerp(currentDistance, FOCUS_DISTANCE, 0.06);
    camera.position.copy(controls.target).addScaledVector(dir, newDistance);
    controls.update();

    if (controls.target.distanceTo(targetVec) < 0.02 && Math.abs(newDistance - FOCUS_DISTANCE) < 0.05) {
      focusRef.current = null;
    }
  });
  return null;
}

function BoardPlane({ bg, width, height }: { bg: string; width: number; height: number }) {
  const texture = useTexture(bg);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Rotates only around Y so the card always faces the camera head-on, no
// matter which side you orbit to — computed directly from camera/object
// world position each frame rather than derived from a locked-axis
// quaternion decomposition (which flips/spins incorrectly past certain
// angles, e.g. viewed from behind). Also eases its height toward `y` each
// frame (e.g. the drag-lift) instead of a declarative position prop, since
// re-applying `position` reactively on every render would undo the lerp
// and make the lift pop instead of glide.
function YBillboard({ y, children }: { y: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    if (!initialized.current) {
      ref.current.position.y = y;
      initialized.current = true;
    } else {
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, y, TOKEN_LERP_FACTOR);
    }
    ref.current.getWorldPosition(worldPos.current);
    const dx = camera.position.x - worldPos.current.x;
    const dz = camera.position.z - worldPos.current.z;
    ref.current.rotation.y = Math.atan2(dx, dz);
  });
  return <group ref={ref}>{children}</group>;
}

// Flat ring marking the token's ground position — not physically connected
// to the floating card above it, just an indicator of where it "is". While
// dragging, collapses down to a small filled dot instead of the full ring;
// while hovered (and not dragging), brightens to give hover feedback.
function GroundMarker({ isDragging, isHovered }: { isDragging: boolean; isHovered: boolean }) {
  return (
    <group position={[0, 0.005, 0]}>
      {/* invisible filled disc so clicking/dragging/hovering anywhere inside the ring still hits the token */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[GROUND_RADIUS, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {isDragging ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <circleGeometry args={[DRAG_GROUND_RADIUS, 24]} />
          <meshBasicMaterial color={TOKEN_BORDER_COLOR} side={THREE.DoubleSide} />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <ringGeometry args={[GROUND_RADIUS - GROUND_RING_WIDTH, GROUND_RADIUS, 32]} />
          <meshBasicMaterial color={isHovered ? HOVER_RING_COLOR : TOKEN_BORDER_COLOR} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function StandeeCard({ image, isDragging }: { image: string; isDragging: boolean }) {
  const texture = useTexture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Crop the portrait to the card's narrower width instead of squeezing it —
  // sample only the center slice of the image horizontally, full height.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.repeat.x = STANDEE_WIDTH_SCALE;
  texture.offset.x = (1 - STANDEE_WIDTH_SCALE) / 2;
  texture.needsUpdate = true;

  const img = texture.image as { width?: number; height?: number } | undefined;
  const aspect = img?.width && img?.height ? img.width / img.height : STANDEE_FALLBACK_ASPECT;
  const cardHeight = STANDEE_HEIGHT;
  const cardWidth = cardHeight * aspect * STANDEE_WIDTH_SCALE;
  const floatHeight = FLOAT_HEIGHT + (isDragging ? DRAG_LIFT : 0);

  return (
    <YBillboard y={floatHeight + cardHeight / 2}>
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[cardWidth + STANDEE_BORDER, cardHeight + STANDEE_BORDER]} />
        <meshBasicMaterial color={TOKEN_BORDER_COLOR} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </YBillboard>
  );
}

function StandeeFallback({ isDragging }: { isDragging: boolean }) {
  const cardHeight = STANDEE_HEIGHT;
  const cardWidth = cardHeight * STANDEE_FALLBACK_ASPECT * STANDEE_WIDTH_SCALE;
  const floatHeight = FLOAT_HEIGHT + (isDragging ? DRAG_LIFT : 0);

  return (
    <YBillboard y={floatHeight + cardHeight / 2}>
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[cardWidth + STANDEE_BORDER, cardHeight + STANDEE_BORDER]} />
        <meshBasicMaterial color={TOKEN_BORDER_COLOR} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshBasicMaterial color="#1a1a1a" side={THREE.DoubleSide} />
      </mesh>
    </YBillboard>
  );
}

// Token: a ring on the board marking where the character "is", with a flat,
// always-camera-facing portrait card floating above it — the two are only
// visually associated, not physically connected. Left-click-drag moves it
// across the (invisible) drag plane; right-click selects it (the resize
// control itself lives outside the 3D scene, as a plain UI overlay).
function TokenMarker({
  token, scene, width, height, isDragging, isHovered, dragPosRef, onPointerDown, onPointerOver, onPointerOut, onPointerMoveHover,
}: {
  token: Token3D;
  scene: Scene;
  width: number;
  height: number;
  isDragging: boolean;
  isHovered: boolean;
  dragPosRef: React.RefObject<{ x: number; z: number } | null>;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMoveHover: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleGroupRef = useRef<THREE.Group>(null);
  const base = gridToWorld(token, scene, width, height);
  const scale = token.scale ?? 1;

  // Ease the visual position toward its target every frame — driven by a
  // ref rather than React state, so mouse moves during a drag never trigger
  // a re-render and the motion stays smooth regardless of event rate. Also
  // eases a size "pop" on hover the same way.
  useFrame(() => {
    if (!groupRef.current) return;
    const target = isDragging && dragPosRef.current ? dragPosRef.current : base;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, target.x, TOKEN_LERP_FACTOR);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, target.z, TOKEN_LERP_FACTOR);

    if (!scaleGroupRef.current) return;
    const targetScale = scale * (isHovered ? HOVER_SCALE_BOOST : 1);
    scaleGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(scaleGroupRef.current.scale.x, targetScale, TOKEN_LERP_FACTOR));
  });

  return (
    <group
      ref={groupRef}
      position={[base.x, 0, base.z]}
      onPointerDown={onPointerDown}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerMove={onPointerMoveHover}
      onContextMenu={(e) => e.nativeEvent.preventDefault()}
    >
      <group ref={scaleGroupRef} scale={scale}>
        <GroundMarker isDragging={isDragging} isHovered={isHovered} />
        <Suspense fallback={<StandeeFallback isDragging={isDragging} />}>
          {token.image
            ? <StandeeCard image={token.image} isDragging={isDragging} />
            : <StandeeFallback isDragging={isDragging} />}
        </Suspense>
      </group>
    </group>
  );
}

export default function PlayCanvas3D({ scene, tokens = [], onMoveToken, onResizeToken }: Props) {
  const navigate = useNavigate();
  const { width, height } = boardSize(scene.bgBounds);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const selectedToken = tokens.find(t => t.id === selectedId) ?? null;
  const hoveredToken = tokens.find(t => t.id === hoveredId) ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  // Mutated directly on every pointer move — deliberately NOT React state,
  // so dragging doesn't trigger a re-render per mouse-move event.
  const dragPosRef = useRef<{ x: number; z: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const focusRef = useRef<{ x: number; z: number } | null>(null);

  // The party bar (bottom-left of the Play screen) dispatches this on click
  // to ask the camera to zoom in on that character's token.
  useEffect(() => {
    const handler = (e: Event) => {
      const character = (e as CustomEvent<{ id: string }>).detail;
      const token = tokens.find(t => t.characterId === character?.id);
      if (!token) return;
      const pos = gridToWorld(token, scene, width, height);
      focusRef.current = { x: pos.x, z: pos.z };
    };
    window.addEventListener("center-on-character", handler);
    return () => window.removeEventListener("center-on-character", handler);
  }, [tokens, scene, width, height]);

  const closeMenu = () => {
    setSelectedId(null);
    setMenuPos(null);
  };

  const trackTooltipPos = (e: ThreeEvent<PointerEvent>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltipPos({ x: e.nativeEvent.clientX - (rect?.left ?? 0), y: e.nativeEvent.clientY - (rect?.top ?? 0) });
  };

  const handleTokenPointerOver = (tokenId: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredId(tokenId);
    trackTooltipPos(e);
  };

  const handleTokenPointerOut = (tokenId: string) => () => {
    setHoveredId(prev => (prev === tokenId ? null : prev));
  };

  // Left-click drags the token; right-click replaces the browser's context
  // menu with the resize panel, opened right at the cursor (and never moves
  // the token).
  const handleTokenPointerDown = (tokenId: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.button === 2) {
      const rect = containerRef.current?.getBoundingClientRect();
      setMenuPos({ x: e.nativeEvent.clientX - (rect?.left ?? 0), y: e.nativeEvent.clientY - (rect?.top ?? 0) });
      setSelectedId(tokenId);
      return;
    }
    if (e.button !== 0) return;
    dragPosRef.current = { x: e.point.x, z: e.point.z };
    setDraggingId(tokenId);
  };

  const handleDragMove = (e: ThreeEvent<PointerEvent>) => {
    if (!draggingId) return;
    dragPosRef.current = { x: e.point.x, z: e.point.z };
  };

  const handleDragEnd = (e: ThreeEvent<PointerEvent>) => {
    if (!draggingId) return;
    const { col, row } = worldToGrid(e.point.x, e.point.z, scene, width, height);
    onMoveToken?.(draggingId, col, row);
    setDraggingId(null);
    // Deliberately leave dragPosRef holding the drop point rather than
    // nulling it: `isDragging` (React state) only flips to false once the
    // pending re-render commits, and until then TokenMarker's useFrame may
    // still read it with the old isDragging=true. If we'd cleared the ref
    // here, that stale window would make the lerp target fall through to
    // `base` — which at that instant is still the pre-drop position — and
    // the token would visibly snap backward for a frame before catching up.
  };

  return (
    <div ref={containerRef} className="relative w-full h-full" onContextMenu={(e) => e.preventDefault()}>
      <Canvas camera={{ position: [0, 9, 9], fov: 50 }}>
        <color attach="background" args={["#0a0a0a"]} />
        {scene.bg && (
          <Suspense fallback={null}>
            <BoardPlane bg={scene.bg} width={width} height={height} />
          </Suspense>
        )}
        {/* Invisible plane tokens are dragged across; also swallows pointer-up outside any other mesh, and clicking it closes the resize menu */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onPointerDown={closeMenu}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
        >
          <planeGeometry args={[DRAG_PLANE_SIZE, DRAG_PLANE_SIZE]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {tokens.map(t => (
          <TokenMarker
            key={t.id}
            token={t}
            scene={scene}
            width={width}
            height={height}
            isDragging={draggingId === t.id}
            isHovered={hoveredId === t.id && !draggingId}
            dragPosRef={dragPosRef}
            onPointerDown={handleTokenPointerDown(t.id)}
            onPointerOver={handleTokenPointerOver(t.id)}
            onPointerOut={handleTokenPointerOut(t.id)}
            onPointerMoveHover={trackTooltipPos}
          />
        ))}
        <OrbitControls ref={controlsRef} makeDefault enabled={!draggingId} enableDamping dampingFactor={0.08} minDistance={2} maxDistance={40} />
        <CameraFocus controlsRef={controlsRef} focusRef={focusRef} />
      </Canvas>
      {!scene.bg && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gold-700 text-sm">This scene has no background image.</p>
        </div>
      )}
      {selectedToken && menuPos && (() => {
        const rect = containerRef.current?.getBoundingClientRect();
        const menuW = 220;
        const menuH = 96;
        const left = rect && menuPos.x + menuW > rect.width ? menuPos.x - menuW : menuPos.x;
        const top = rect && menuPos.y + menuH > rect.height ? menuPos.y - menuH : menuPos.y;
        return (
          <div
            className="absolute z-20 w-56 rounded-lg border border-gold-500 bg-surface shadow-lg shadow-black/50 overflow-hidden"
            style={{ left, top }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-1.5 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-gold-500 text-[10px] font-semibold uppercase tracking-wider">Size</span>
                <span className="text-gold-300 text-[10px] font-medium">{Math.round((selectedToken.scale ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.05}
                value={selectedToken.scale ?? 1}
                onChange={(e) => onResizeToken?.(selectedToken.id, Number(e.target.value))}
                className="w-full accent-gold-400"
              />
            </div>
            <div
              className="px-3 py-2 border-t border-gold-500/20 hover:bg-gold-500/10 cursor-pointer transition-colors flex items-center gap-2 text-gold-300 text-xs"
              onClick={() => {
                navigate("/character-editor", { state: { existing: { id: selectedToken.characterId } } });
                closeMenu();
              }}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Character
            </div>
          </div>
        );
      })()}
      {hoveredToken && tooltipPos && !draggingId && (
        <div
          className="absolute z-10 px-2 py-1 rounded-md border border-gold-500/40 bg-[#161310] shadow-lg shadow-black/50 pointer-events-none whitespace-nowrap text-gold-300 text-xs font-medium"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y + 14 }}
        >
          {hoveredToken.name}
        </div>
      )}
    </div>
  );
}
