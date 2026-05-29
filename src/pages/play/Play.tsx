import { Backpack, Map, Menu, User } from "lucide-react";
import { Dropdown, Option } from "../../components/ui/dropdown/Dropdown";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import PlayCanvas from "../../components/game/PlayCanvas";
import { Scene } from "../../components/game/SceneEditor";
import { cellCenter, gridBounds } from "../../components/game/HexSceneView";
import PlayersDisplay from "../../components/game/PlayersDisplay";
import GlobalSearchBar from "../../components/GlobalSearchBar";
import SceneMapCanvas from "../../components/game/SceneMapCanvas";
import type { Campaign, SavedToken } from "../../components/campaign/CampaignSelector";
import type { Character } from "../character/character-editor";

export interface Token {
  id: string;
  characterId: string;
  name: string;
  image?: string;
  col: number;
  row: number;
}

// Module-level cache to persist state across navigations
const playCache: Record<string, {
  campaign: Campaign;
  activeScene: Scene | null;
  tokens: Token[];
  sceneCharacters: Character[];
  sceneTokensMap: Record<string, SavedToken[]>;
}> = {};

export default function Play() {
  const navigate = useNavigate();
  const location = useLocation();
  const campaignId = (location.state as { campaign?: Campaign } | null)?.campaign?.id ?? null;
  const cached = campaignId ? playCache[campaignId] : undefined;

  const [activeScene, setActiveSceneRaw] = useState<Scene | null>(cached?.activeScene ?? null);
  const [campaign, setCampaign] = useState<Campaign | null>(cached?.campaign ?? null);
  const [tokens, setTokens] = useState<Token[]>(cached?.tokens ?? []);
  const [sceneCharacters, setSceneCharacters] = useState<Character[]>(cached?.sceneCharacters ?? []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingCharacter, setDraggingCharacter] = useState<Character | null>(null);
  const [dragGhostPos, setDragGhostPos] = useState<{ x: number; y: number } | null>(null);

  // Map of sceneId -> tokens for persistence across scene switches
  const sceneTokensMapRef = useRef<Record<string, SavedToken[]>>(cached?.sceneTokensMap ?? {});
  const activeSceneRef = useRef<Scene | null>(cached?.activeScene ?? null);

  // Save current campaign state to backend
  const persistCampaign = useCallback((camp: Campaign, sceneTokensMap: Record<string, SavedToken[]>, lastScene?: string) => {
    const updated = { ...camp, sceneTokens: sceneTokensMap, lastActiveScene: lastScene ?? camp.lastActiveScene };
    invoke("save_campaign", { campaign: updated }).catch(() => {});
  }, []);

  // Update module-level cache
  useEffect(() => {
    if (!campaignId || !campaign) return;
    playCache[campaignId] = {
      campaign,
      activeScene: activeSceneRef.current,
      tokens,
      sceneCharacters,
      sceneTokensMap: sceneTokensMapRef.current,
    };
  }, [campaignId, campaign, activeScene, tokens, sceneCharacters]);

  // Save current tokens into the map for the active scene
  const saveCurrentSceneTokens = useCallback(() => {
    const scene = activeSceneRef.current;
    if (!scene) return;
    setTokens(currentTokens => {
      sceneTokensMapRef.current[scene.id] = currentTokens.map(t => ({
        id: t.id,
        characterId: t.characterId,
        name: t.name,
        image: t.image,
        col: t.col,
        row: t.row,
      }));
      return currentTokens;
    });
  }, []);

  // Wrapped setActiveScene that persists state on switch
  const setActiveScene = useCallback((scene: Scene | null) => {
    // Save tokens for the scene we're leaving
    saveCurrentSceneTokens();

    // Ensure disabledCells is a Set (may arrive as array from JSON)
    if (scene && !(scene.disabledCells instanceof Set)) {
      scene = { ...scene, disabledCells: new Set(scene.disabledCells as unknown as string[]) };
    }

    // Load tokens for the new scene
    if (scene) {
      const savedTokens = sceneTokensMapRef.current[scene.id] ?? [];
      setTokens(savedTokens.map(t => ({ ...t })));
      // Rebuild sceneCharacters from tokens
      invoke<Character[]>("list_characters").then(allChars => {
        const charIds = new Set(savedTokens.map(t => t.characterId));
        setSceneCharacters(allChars.filter(c => charIds.has(c.id)));
      }).catch(() => {});
    } else {
      setTokens([]);
      setSceneCharacters([]);
    }

    setActiveSceneRaw(scene);
    activeSceneRef.current = scene;

    // Persist the last active scene
    if (campaign) {
      persistCampaign(campaign, sceneTokensMapRef.current, scene?.id);
    }
  }, [campaign, saveCurrentSceneTokens, persistCampaign]);

  useEffect(() => {
    if (!campaignId) return;
    const refresh = () =>
      invoke<Campaign[]>("list_campaigns")
        .then(all => {
          const camp = all.find(c => c.id === campaignId) ?? null;
          setCampaign(camp);
          // Initialize sceneTokensMap from saved campaign data
          if (camp?.sceneTokens) {
            sceneTokensMapRef.current = { ...camp.sceneTokens };
          }
          // Restore last active scene on first load
          if (camp?.lastActiveScene && !activeSceneRef.current) {
            invoke<Scene[]>("list_scenes").then(scenes => {
              const raw = scenes.find(s => s.id === camp.lastActiveScene);
              if (raw) {
                const lastScene = { ...raw, disabledCells: new Set(raw.disabledCells as unknown as string[]) };
                const savedTokens = sceneTokensMapRef.current[lastScene.id] ?? [];
                setTokens(savedTokens.map(t => ({ ...t })));
                setActiveSceneRaw(lastScene);
                activeSceneRef.current = lastScene;
                invoke<Character[]>("list_characters").then(allChars => {
                  const charIds = new Set(savedTokens.map(t => t.characterId));
                  setSceneCharacters(allChars.filter(c => charIds.has(c.id)));
                }).catch(() => {});
              }
            }).catch(() => {});
          }
        })
        .catch(() => {});
    refresh();
    window.addEventListener("campaign-updated", refresh);
    return () => window.removeEventListener("campaign-updated", refresh);
  }, [campaignId]);

  const addToken = (character: Character, col: number, row: number) => {
    setTokens(prev => {
      const updated = [
        ...prev.filter(t => t.characterId !== character.id),
        { id: crypto.randomUUID(), characterId: character.id, name: character.name, image: character.image, col, row },
      ];
      // Persist immediately
      if (activeSceneRef.current && campaign) {
        sceneTokensMapRef.current[activeSceneRef.current.id] = updated.map(t => ({
          id: t.id, characterId: t.characterId, name: t.name, image: t.image, col: t.col, row: t.row,
        }));
        persistCampaign(campaign, sceneTokensMapRef.current);
      }
      return updated;
    });
    setSceneCharacters(prev =>
      prev.some(c => c.id === character.id) ? prev : [...prev, character]
    );
  };

  const moveToken = (tokenId: string, col: number, row: number) => {
    setTokens(prev => {
      const updated = prev.map(t => t.id === tokenId ? { ...t, col, row } : t);
      // Persist immediately
      if (activeSceneRef.current && campaign) {
        sceneTokensMapRef.current[activeSceneRef.current.id] = updated.map(t => ({
          id: t.id, characterId: t.characterId, name: t.name, image: t.image, col: t.col, row: t.row,
        }));
        persistCampaign(campaign, sceneTokensMapRef.current);
      }
      return updated;
    });
  };

  // Listen for character-selected events (from sidebar click or search bar)
  useEffect(() => {
    const handler = (e: Event) => {
      const character = (e as CustomEvent<Character>).detail;
      if (!character || !activeScene) return;
      if (activeScene.gridType === "none") {
        // Free mode: place at center of canvas (pixel coords)
        const cx = activeScene.bgBounds ? Math.round(activeScene.bgBounds.w / 2) : 400;
        const cy = activeScene.bgBounds ? Math.round(activeScene.bgBounds.h / 2) : 300;
        addToken(character, cx, cy);
      } else {
        const col = Math.floor(activeScene.cols / 2);
        const row = Math.floor(activeScene.rows / 2);
        addToken(character, col, row);
      }
    };
    window.addEventListener("character-selected", handler);
    return () => window.removeEventListener("character-selected", handler);
  }, [activeScene]);

  // Custom drag from sidebar: start tracking mouse when character drag begins
  const onCharacterDragStart = useCallback((character: Character, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingCharacter(character);
    setDragGhostPos({ x: e.clientX, y: e.clientY });

    const onMove = (ev: MouseEvent) => {
      setDragGhostPos({ x: ev.clientX, y: ev.clientY });
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDraggingCharacter(null);
      setDragGhostPos(null);

      // Check if dropped on canvas area
      if (!canvasRef.current || !activeScene) return;
      const rect = canvasRef.current.getBoundingClientRect();
      if (ev.clientX < rect.left || ev.clientX > rect.right || ev.clientY < rect.top || ev.clientY > rect.bottom) return;

      const cs = activeScene.cellSize;
      const nb = gridBounds(activeScene);
      const bgB = activeScene.bgBounds;
      const cellCoverW = nb.w - cs;
      const cellCoverH = nb.h - cs;
      const gf = bgB ? Math.max(bgB.w / cellCoverW, bgB.h / cellCoverH) : 1;
      const contentW = bgB ? cellCoverW * gf : nb.w;
      const contentH = bgB ? cellCoverH * gf : nb.h;
      const zoom = Math.min(rect.width / contentW, rect.height / contentH) * 0.85;
      const camX = bgB ? (rect.width - cellCoverW * gf * zoom) / 2 : 0;
      const camY = bgB ? (rect.height - cellCoverH * gf * zoom) / 2 : 0;
      const svgX = ((ev.clientX - rect.left) - camX) / zoom / gf;
      const svgY = ((ev.clientY - rect.top) - camY) / zoom / gf;

      if (activeScene.gridType === "none") {
        addToken(character, Math.round(svgX), Math.round(svgY));
      } else {
        let bestCol = 0, bestRow = 0, bestDist = Infinity;
        for (let c = 0; c < activeScene.cols; c++) {
          for (let r = 0; r < activeScene.rows; r++) {
            const { x, y } = cellCenter(c, r, activeScene.gridType, cs);
            const d = (x - svgX) ** 2 + (y - svgY) ** 2;
            if (d < bestDist) { bestDist = d; bestCol = c; bestRow = r; }
          }
        }
        addToken(character, bestCol, bestRow);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [activeScene]);

  return (
    <main className="h-full min-w-screen bg-base flex justify-center items-center relative overflow-hidden" ref={canvasRef}>
      <GlobalSearchBar activeCampaign={campaign} />
      {activeScene ? (
        <PlayCanvas ref={canvasRef} scene={activeScene} tokens={tokens} onDropCharacter={addToken} onMoveToken={moveToken} />
      ) : (
        <div className="w-full h-full flex items-center justify-center flex-col text-gold-700 gap-4">
          <p>Welcome to <span className="text-gold-400 font-bold">D&Saster</span> start your campaign by <span className="font-bold">creating a new scene.</span></p>
        </div>
      )}
      <div
        className="absolute w-full h-full flex flex-row justify-between pointer-events-none"
        style={{ zIndex: 2 }}
      >
        <div className="flex flex-col justify-between w-fit h-full p-4">
            <ExpandableMenu
              MainButton={{ MainComponent: <Menu className="h-5 w-5" /> }}
              Options={[
                { label: "Settings", onClick: () => alert("Settings clicked") },
                { label: "Exit", onClick: () => navigate("/campaign"), className: "text-red-300" },
              ]}
            />
          <div className="flex justify-between items-end">
            <PlayersDisplay characters={sceneCharacters} />
          </div>
        </div>
        <div className="flex flex-row w-fit h-full justify-end">
          <SideMenu campaign={campaign} setActiveScene={setActiveScene} activeScene={activeScene} onCharacterDragStart={onCharacterDragStart} />
        </div>
      </div>
      {/* Drag ghost */}
      {draggingCharacter && dragGhostPos && (
        <div
          className="fixed pointer-events-none z-50 flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gold-500/40 bg-base/90 shadow-lg"
          style={{ left: dragGhostPos.x, top: dragGhostPos.y, transform: "translate(-50%, -50%)" }}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden border border-gold-500/30 bg-base flex items-center justify-center shrink-0">
            {draggingCharacter.image ? (
              <img src={draggingCharacter.image} className="w-full h-full object-cover" />
            ) : (
              <User className="h-3 w-3 text-gold-700" />
            )}
          </div>
          <span className="text-gold-300 text-xs font-medium">{draggingCharacter.name || "Unnamed"}</span>
        </div>
      )}
    </main>
  );
}

type SideTab = "scenes" | "characters" | "items";

function SideMenu({
  campaign, setActiveScene, activeScene, onCharacterDragStart,
}: {
  campaign: Campaign | null;
  setActiveScene: (scene: Scene | null) => void;
  activeScene: Scene | null;
  onCharacterDragStart: (character: Character, e: React.MouseEvent) => void;
}) {
  const [activeTab, setActiveTab] = useState<SideTab | null>(null);
  const [width, setWidth] = useState(500);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const toggle = (tab: SideTab) =>
    setActiveTab(prev => (prev === tab ? null : tab));

  const isOpen = activeTab !== null;

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    startX.current = e.clientX;
    startW.current = width;

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const delta = startX.current - ev.clientX; // dragging left = bigger
      const minW = Math.round(window.innerWidth * 0.2);
      const maxW = Math.round(window.innerWidth * 0.5);
      setWidth(Math.max(minW, Math.min(startW.current + delta, maxW)));
    };
    const onUp = () => {
      resizing.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  const onResizeDoubleClick = useCallback(() => {
    const minW = Math.round(window.innerWidth * 0.2);
    const maxW = Math.round(window.innerWidth * 0.5);
    setWidth(prev => prev < maxW ? maxW : minW);
  }, []);

  return (
    <>
      <div className="p-4 flex flex-col gap-2 text-gold-400 h-fit pointer-events-auto">
        <SideTabButton icon={<Map className="h-5 w-5" />} active={activeTab === "scenes"} onClick={() => toggle("scenes")} />
        <SideTabButton icon={<User className="h-5 w-5" />} active={activeTab === "characters"} onClick={() => toggle("characters")} />
        <SideTabButton icon={<Backpack className="h-5 w-5" />} active={activeTab === "items"} onClick={() => toggle("items")} />
      </div>
      <div
        className={`h-full bg-base border-gold-500/40 ${isOpen ? "border-l" : "border-l-0"} overflow-hidden pointer-events-auto relative`}
        style={{ width: isOpen ? width : 0, transition: isOpen ? undefined : "width 0.3s" }}
      >
        {/* Resize handle */}
        {isOpen && (
          <div
            className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize z-10 hover:bg-gold-400/20 active:bg-gold-400/30 transition-colors"
            onMouseDown={onResizeStart}
            onDoubleClick={onResizeDoubleClick}
            title="Drag to resize · Double-click to toggle"
          />
        )}
        <div className="h-full" style={{ width }}>
          {activeTab === "scenes" && (
            <SceneManager campaign={campaign} onSceneSelect={setActiveScene} activeSceneId={activeScene?.id ?? null} />
          )}
          {activeTab === "characters" && (
            <CharactersPanel campaign={campaign} onCharacterDragStart={onCharacterDragStart} />
          )}
          {activeTab === "items" && (
            <ItemsPanel campaign={campaign} />
          )}
        </div>
      </div>
    </>);
}

function SideTabButton({ icon, active, onClick }: { icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-1 rounded transition-colors ${active ? "text-gold-300 bg-[#1F1B13]" : "text-gold-600 hover:text-gold-400 bg-[#161310]"}`}
    >
      {icon}
    </button>
  );
}

function CharactersPanel({ campaign, onCharacterDragStart }: { campaign: Campaign | null; onCharacterDragStart: (character: Character, e: React.MouseEvent) => void }) {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    invoke<Character[]>("list_characters").then(setCharacters).catch(() => {});
  }, []);

  if (!campaign) return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-gold-700 text-sm">No campaign loaded.</p>
    </div>
  );

  const players = characters.filter(c => c.type === "player");
  const npcs = characters.filter(c => c.type === "npc");

  const onCharacterClick = (character: Character) => {
    window.dispatchEvent(new CustomEvent("character-selected", { detail: character }));
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gold-500/20">
        <User className="h-4 w-4 text-gold-400" />
        <p className="text-gold-400 font-medium text-sm">Characters</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {characters.length === 0 && (
          <p className="text-gold-700 text-xs">No characters created yet.</p>
        )}

        {players.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">Players</span>
            <div className="flex flex-col gap-1">
              {players.map(c => (
                <CharacterDragItem key={c.id} character={c} onClick={onCharacterClick} onDragStart={onCharacterDragStart} />
              ))}
            </div>
          </div>
        )}

        {npcs.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-gold-600 text-xs font-semibold uppercase tracking-wider">NPCs</span>
            <div className="flex flex-col gap-1">
              {npcs.map(c => (
                <CharacterDragItem key={c.id} character={c} onClick={onCharacterClick} onDragStart={onCharacterDragStart} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterDragItem({ character, onClick, onDragStart }: { character: Character; onClick: (c: Character) => void; onDragStart: (character: Character, e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={(e) => { if (e.button === 0) onDragStart(character, e); }}
      onClick={() => onClick(character)}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-gold-500/20 bg-surface/40 cursor-grab hover:border-gold-500/40 transition-colors active:cursor-grabbing select-none"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gold-500/30 bg-base flex items-center justify-center">
        {character.image ? (
          <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
        ) : (
          <User className="h-4 w-4 text-gold-700" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-gold-300 text-sm font-medium truncate">{character.name || "Unnamed"}</span>
        <span className="text-gold-700 text-[10px] capitalize">{character.type}</span>
      </div>
    </div>
  );
}

function ItemsPanel({ campaign }: { campaign: Campaign | null }) {
  if (!campaign) return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-gold-700 text-sm">No campaign loaded.</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gold-500/20">
        <Backpack className="h-4 w-4 text-gold-400" />
        <p className="text-gold-400 font-medium text-sm">Items</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-gold-700 text-xs">No items added yet.</p>
      </div>
    </div>
  );
}

function SceneManager({ campaign, onSceneSelect, activeSceneId }: { campaign: Campaign | null; onSceneSelect: (scene: Scene) => void; activeSceneId: string | null }) {
  if (!campaign) return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-gold-700 text-sm">No campaign loaded.</p>
    </div>
  );

  return <SceneMapCanvas campaign={campaign} onSceneSelect={onSceneSelect} activeSceneId={activeSceneId} />;
}

function ExpandableMenu({
  MainButton,
  Options,
}: {
  MainButton: { MainComponent: React.ReactNode; className?: string };
  Options: { label: string; onClick: () => void; className?: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={MainButton.className}>
        {MainButton.MainComponent}
      </button>
      {isOpen && (
        <Dropdown>
          {Options.map((option, index) => (
            <Option key={index} onClick={option.onClick} className={option.className}>
              {option.label}
            </Option>
          ))}
        </Dropdown>
      )}
    </div>
  );
}
