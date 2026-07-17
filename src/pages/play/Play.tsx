import { Backpack, Menu } from "lucide-react";
import { Dropdown, Option } from "../../components/ui/dropdown/Dropdown";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import PlayCanvas3D from "../../components/game/PlayCanvas3D";
import { Scene } from "../../components/game/SceneEditor";
import PlayersDisplay from "../../components/game/PlayersDisplay";
import GlobalSearchBar from "../../components/GlobalSearchBar";
import type { Campaign, SavedToken } from "../../components/campaign/CampaignSelector";
import type { Character } from "../character/character-editor";
import { openChildWindow } from "../../lib/childWindow";
import type { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { broadcastActiveScene, onCampaignUpdated, onCharacterSelectRequest, onSceneSelectRequest, onSceneUpdated } from "../../lib/appEvents";

export interface Token {
  id: string;
  characterId: string;
  name: string;
  image?: string;
  col: number;
  row: number;
  scale?: number;
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

  // Map of sceneId -> tokens for persistence across scene switches
  const sceneTokensMapRef = useRef<Record<string, SavedToken[]>>(cached?.sceneTokensMap ?? {});
  const activeSceneRef = useRef<Scene | null>(cached?.activeScene ?? null);

  // Local roster cache so scene switches don't need to hit disk just to
  // resolve token -> character data.
  const allCharactersRef = useRef<Character[]>([]);
  useEffect(() => {
    const load = () =>
      invoke<Character[]>("list_characters").then(allChars => {
        allCharactersRef.current = allChars;
        setSceneCharacters(prev => prev.map(c => allChars.find(a => a.id === c.id) ?? c));
      }).catch(() => {});
    load();
    window.addEventListener("character-updated", load);
    return () => window.removeEventListener("character-updated", load);
  }, []);

  // Kept in sync with `campaign` state so callbacks that fire on every
  // campaign broadcast (e.g. setActiveScene) don't need it as a dependency —
  // that would tear down and re-subscribe their event listeners on every
  // unrelated campaign update, risking a missed event mid-resubscribe.
  const campaignRef = useRef<Campaign | null>(campaign);
  useEffect(() => { campaignRef.current = campaign; }, [campaign]);

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
        scale: t.scale,
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
      // Rebuild sceneCharacters from the cached roster — no disk round trip
      const charIds = new Set(savedTokens.map(t => t.characterId));
      setSceneCharacters(allCharactersRef.current.filter(c => charIds.has(c.id)));
    } else {
      setTokens([]);
      setSceneCharacters([]);
    }

    setActiveSceneRaw(scene);
    activeSceneRef.current = scene;
    broadcastActiveScene(scene?.id ?? null);

    // Persist the last active scene
    if (campaignRef.current) {
      persistCampaign(campaignRef.current, sceneTokensMapRef.current, scene?.id);
    }
  }, [saveCurrentSceneTokens, persistCampaign]);

  // Let other windows (e.g. the toolbox map tab) request a scene switch.
  // The full scene rides along with the request, so this applies instantly
  // with no round trip back to disk.
  useEffect(() => {
    const unlisten = onSceneSelectRequest(setActiveScene);
    return () => { unlisten.then(u => u()); };
  }, [setActiveScene]);

  // Let other windows (e.g. the toolbox characters tab) request a token drop
  useEffect(() => {
    const unlisten = onCharacterSelectRequest((character) => {
      window.dispatchEvent(new CustomEvent("character-selected", { detail: character }));
    });
    return () => { unlisten.then(u => u()); };
  }, []);

  // Reload the active scene instantly if its own data (grid type, size, background...)
  // is edited from any window, e.g. the toolbox map tab's "Edit Scene" action
  useEffect(() => {
    const unlisten = onSceneUpdated((scene) => {
      if (activeSceneRef.current?.id === scene.id) setActiveScene(scene);
    });
    return () => { unlisten.then(u => u()); };
  }, [setActiveScene]);

  // Cold-start load: fetch from disk once and restore the last active scene
  useEffect(() => {
    if (!campaignId) return;
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
  }, [campaignId]);

  // Live updates: applied directly from the broadcasted campaign, no disk read
  useEffect(() => {
    if (!campaignId) return;
    const unlisten = onCampaignUpdated((camp) => {
      if (camp.id !== campaignId) return;
      setCampaign(camp);
      if (camp.sceneTokens) {
        sceneTokensMapRef.current = { ...camp.sceneTokens };
        // Refresh the live canvas immediately if the active scene's own
        // tokens changed (e.g. a character was dropped from the toolbox)
        const activeId = activeSceneRef.current?.id;
        if (activeId) {
          const savedTokens = camp.sceneTokens[activeId] ?? [];
          setTokens(savedTokens.map(t => ({ ...t })));
          const charIds = new Set(savedTokens.map(t => t.characterId));
          setSceneCharacters(allCharactersRef.current.filter(c => charIds.has(c.id)));
        }
      }
    });
    return () => { unlisten.then(u => u()); };
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
          id: t.id, characterId: t.characterId, name: t.name, image: t.image, col: t.col, row: t.row, scale: t.scale,
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
          id: t.id, characterId: t.characterId, name: t.name, image: t.image, col: t.col, row: t.row, scale: t.scale,
        }));
        persistCampaign(campaign, sceneTokensMapRef.current);
      }
      return updated;
    });
  };

  const resizeToken = (tokenId: string, scale: number) => {
    setTokens(prev => {
      const updated = prev.map(t => t.id === tokenId ? { ...t, scale } : t);
      // Persist immediately
      if (activeSceneRef.current && campaign) {
        sceneTokensMapRef.current[activeSceneRef.current.id] = updated.map(t => ({
          id: t.id, characterId: t.characterId, name: t.name, image: t.image, col: t.col, row: t.row, scale: t.scale,
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

  return (
    <main className="h-full min-w-screen bg-base flex justify-center items-center relative overflow-hidden">
      <GlobalSearchBar activeCampaign={campaign} />
      {activeScene ? (
        <PlayCanvas3D scene={activeScene} tokens={tokens} onMoveToken={moveToken} onResizeToken={resizeToken} />
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
          <SideMenu campaign={campaign} />
        </div>
      </div>
    </main>
  );
}

function SideMenu({ campaign }: { campaign: Campaign | null }) {
  const [toolboxWindowOpen, setToolboxWindowOpen] = useState(false);
  const toolboxWindowRef = useRef<WebviewWindow | null>(null);

  const toggleToolboxWindow = useCallback(() => {
    if (toolboxWindowRef.current) {
      toolboxWindowRef.current.close();
      return;
    }
    const win = openChildWindow(`/toolbox-window?campaignId=${campaign?.id ?? ""}`, { title: "Toolbox", rememberGeometryKey: "toolbox-window" });
    toolboxWindowRef.current = win;
    setToolboxWindowOpen(true);
    win.once("tauri://destroyed", () => {
      toolboxWindowRef.current = null;
      setToolboxWindowOpen(false);
    });
  }, [campaign]);

  // Close the toolbox window if this menu unmounts (e.g. leaving the campaign)
  useEffect(() => () => { toolboxWindowRef.current?.close(); }, []);

  return (
    <div className="p-4 flex flex-col gap-2 text-gold-400 h-fit pointer-events-auto">
      <SideTabButton icon={<Backpack className="h-5 w-5" />} active={toolboxWindowOpen} onClick={toggleToolboxWindow} />
    </div>
  );
}

function SideTabButton({ icon, active, onClick, title }: { icon: React.ReactNode; active: boolean; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1 rounded transition-colors ${active ? "text-gold-300 bg-[#1F1B13]" : "text-gold-600 hover:text-gold-400 bg-[#161310]"}`}
    >
      {icon}
    </button>
  );
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
