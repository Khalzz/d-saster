import { Backpack, Map, Menu, User, X } from "lucide-react";
import { Dropdown, Option } from "../../components/ui/dropdown/Dropdown";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import HexGrid from "../../components/game/HexGrid";
import PlayCanvas from "../../components/game/PlayCanvas";
import { Scene, DEFAULT_CELL_SIZE } from "../../components/game/SceneEditor";
import PlayersDisplay from "../../components/game/PlayersDisplay";
import GlobalSearchBar from "../../components/GlobalSearchBar";
import type { Campaign } from "../../components/campaign/CampaignSelector";

interface SavedSceneData {
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
      <GlobalSearchBar />
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

function SideMenu({
  campaign, setActiveScene, activeScene,
}: {
  campaign: Campaign | null;
  setActiveScene: (scene: Scene) => void;
  activeScene: Scene | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="p-4 flex flex-col gap-2 text-gold-400 h-fit">
        <button onClick={() => setIsOpen(!isOpen)}><ToggledIcon baseIcon={<Map className="h-5 w-5" />} secundaryIcon={<X className="h-5 w-5" />} state={isOpen} /></button>
        {
          /*
            <button><User className="h-5 w-5 text-gold-400" /></button>
            <button><Backpack className="h-5 w-5 text-gold-400" /></button>
          */
        }
      </div>
      <div className={`h-full bg-base border-gold-500/40 ${isOpen ? "w-125 border-l" : "w-0 border-l-0"} transition-width duration-300 overflow-hidden pointer-events-auto`}>
        <SceneManager campaign={campaign} onSceneSelect={setActiveScene} activeSceneId={activeScene?.id ?? null} />
      </div>
    </>);
}

function ToggledIcon(
  {
    baseIcon,
    secundaryIcon,
    state
  }: {
    baseIcon: React.ReactNode;
    secundaryIcon: React.ReactNode;
    state: boolean;
  }
) {
  return (
    <div className="h-5 w-5 relative">
      <div className={`absolute inset-0 transition-opacity duration-300 ${state ? "opacity-0" : "opacity-100"}`}>
        {baseIcon}
      </div>
      <div className={`absolute inset-0 transition-opacity duration-300 ${state ? "opacity-100" : "opacity-0"}`}>
        {secundaryIcon}
      </div>
    </div>
  );
}

function SceneManager({ campaign, onSceneSelect, activeSceneId }: { campaign: Campaign | null; onSceneSelect: (scene: Scene) => void; activeSceneId: string | null }) {
  const [campaignScenes, setCampaignScenes] = useState<SavedSceneData[]>([]);

  useEffect(() => {
    if (!campaign?.scenes?.length) { setCampaignScenes([]); return; }
    invoke<SavedSceneData[]>("list_scenes").then(all =>
      setCampaignScenes(all.filter(s => campaign.scenes!.includes(s.id)))
    ).catch(() => {});
  }, [campaign]);

  const loadScene = (s: SavedSceneData) => {
    onSceneSelect({
      id: s.id,
      name: s.name,
      gridType: s.gridType as "hex" | "square",
      cols: s.cols,
      rows: s.rows,
      disabledCells: new Set(s.disabledCells),
      bg: s.bg,
      bgBounds: s.bgBounds,
      cellSize: s.cellSize ?? DEFAULT_CELL_SIZE,
    });
  };

  if (!campaign) return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-gold-700 text-sm">No campaign loaded.</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gold-500/20">
        <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: campaign.color }} />
        <p className="text-gold-400 font-medium text-sm truncate">{campaign.title}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {campaignScenes.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {campaignScenes.map(s => {
              const isActive = s.id === activeSceneId;
              return (
                <div
                  key={s.id}
                  onClick={() => loadScene(s)}
                  className={`cursor-pointer rounded-lg overflow-hidden border transition-all hover:scale-[1.02] select-none ${isActive ? "border-gold-400/60" : "border-gold-500/10 hover:border-gold-500/50"}`}
                >
                  <div className="h-24 w-full bg-[#121212] relative flex items-center justify-center">
                    {s.bg
                      ? <img src={s.bg} alt="" className="w-full h-full object-cover" />
                      : <Map className="h-6 w-6 text-gold-800" />
                    }
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                    {isActive && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold uppercase tracking-wider bg-gold-400/90 text-black px-1.5 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  <div className="px-2.5 py-2 bg-surface">
                    <p className="text-gold-400 text-xs font-medium truncate">{s.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gold-700 text-xs px-3 py-2">
            No scenes added to this campaign yet. Use the search bar to add scenes.
          </p>
        )}
      </div>
    </div>
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
