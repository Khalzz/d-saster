import { Backpack, Map, Menu, User } from "lucide-react";
import { Dropdown, Option } from "../../components/ui/dropdown/Dropdown";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import PlayCanvas from "../../components/game/PlayCanvas";
import { Scene } from "../../components/game/SceneEditor";
import PlayersDisplay from "../../components/game/PlayersDisplay";
import GlobalSearchBar from "../../components/GlobalSearchBar";
import SceneMapCanvas from "../../components/game/SceneMapCanvas";
import type { Campaign } from "../../components/campaign/CampaignSelector";

export default function Play() {
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const campaignId = (location.state as { campaign?: Campaign } | null)?.campaign?.id ?? null;

  useEffect(() => {
    if (!campaignId) return;
    const refresh = () =>
      invoke<Campaign[]>("list_campaigns")
        .then(all => setCampaign(all.find(c => c.id === campaignId) ?? null))
        .catch(() => {});
    refresh();
    window.addEventListener("campaign-updated", refresh);
    return () => window.removeEventListener("campaign-updated", refresh);
  }, [campaignId]);

  return (
    <main className="h-full min-w-screen bg-base flex justify-center items-center">
      <GlobalSearchBar activeCampaign={campaign} />
      {activeScene ? (
        <PlayCanvas scene={activeScene} />
      ) : (
        <div className="w-full h-full flex items-center justify-center flex-col text-gold-700 gap-4">
          <p>Welcome to <span className="text-gold-400 font-bold">D&Saster</span> start your campaign by <span className="font-bold">creating a new scene.</span></p>
        </div>
      )}
      <div className="absolute w-full h-full flex flex-row justify-between pointer-events-none">
        <div className="flex flex-col justify-between w-fit h-full p-4">
            <ExpandableMenu
              MainButton={{ MainComponent: <Menu className="h-5 w-5" /> }}
              Options={[
                { label: "Settings", onClick: () => alert("Settings clicked") },
                { label: "Exit", onClick: () => navigate("/campaign"), className: "text-red-300" },
              ]}
            />
          <div className="flex justify-between items-end">
            <PlayersDisplay />
          </div>
        </div>
        <div className="flex flex-row w-fit h-full justify-end">
          <SideMenu campaign={campaign} setActiveScene={setActiveScene} activeScene={activeScene} />
        </div>
      </div>
    </main>
  );
}

type SideTab = "scenes" | "characters" | "items";

function SideMenu({
  campaign, setActiveScene, activeScene,
}: {
  campaign: Campaign | null;
  setActiveScene: (scene: Scene) => void;
  activeScene: Scene | null;
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
            <CharactersPanel campaign={campaign} />
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
      className={`p-1 rounded transition-colors ${active ? "text-gold-300 bg-gold-500/20" : "text-gold-600 hover:text-gold-400"}`}
    >
      {icon}
    </button>
  );
}

function CharactersPanel({ campaign }: { campaign: Campaign | null }) {
  if (!campaign) return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-gold-700 text-sm">No campaign loaded.</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gold-500/20">
        <User className="h-4 w-4 text-gold-400" />
        <p className="text-gold-400 font-medium text-sm">Characters</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-gold-700 text-xs">No characters added yet.</p>
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
