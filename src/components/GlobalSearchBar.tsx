import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Backpack, Map, User } from "lucide-react";
import Modal from "./ui/modal/Modal";
import SearchBar from "./ui/searchbar/SearchBar";
import type { Campaign } from "./campaign/CampaignSelector";

interface SavedScene {
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

export default function GlobalSearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([]);
  const [savedCampaigns, setSavedCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<string[]>(["Kelsier", "Vin", "Sazed"]);
  const [items, setItems] = useState<string[]>(["Health Potion", "Iron Sword", "Leather Armor", "Magic Scroll"]);
  const [pendingAddScene, setPendingAddScene] = useState<SavedScene | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    invoke<SavedScene[]>("list_scenes").then(setSavedScenes).catch(() => {});
    invoke<Campaign[]>("list_campaigns").then(setSavedCampaigns).catch(() => {});
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const addSceneToCampaign = (campaign: Campaign) => {
    if (!pendingAddScene) return;
    const sceneIds = campaign.scenes ?? [];
    if (sceneIds.includes(pendingAddScene.id)) { setPendingAddScene(null); return; }
    const updated: Campaign = { ...campaign, scenes: [...sceneIds, pendingAddScene.id] };
    setSavedCampaigns(prev => prev.map(c => c.id === campaign.id ? updated : c));
    invoke("save_campaign", { campaign: updated }).catch(() => {});
    window.dispatchEvent(new CustomEvent("campaign-updated"));
    setPendingAddScene(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <SearchBar
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          categories={[
            {
              name: "Scenes",
              icon: <Map className="h-4 w-4" />,
              items: savedScenes.map(s => ({ label: s.name, id: s.id })),
              onCreate: (name) => { setIsOpen(false); navigate("/scene-editor", { state: { name } }); },
              onSelect: (item) => {
                const scene = savedScenes.find(s => s.id === item.id);
                if (scene) { setIsOpen(false); setPendingAddScene(scene); }
              },
              onEdit: (item) => {
                const scene = savedScenes.find(s => s.id === item.id);
                if (scene) navigate("/scene-editor", { state: { existing: scene } });
              },
              onDelete: (item) => {
                invoke("delete_scene", { id: item.id }).catch(() => {});
                setSavedScenes(prev => prev.filter(s => s.id !== item.id));
              },
            },
            {
              name: "Characters",
              icon: <User className="h-4 w-4" />,
              items: characters.map(c => ({ label: c })),
              onCreate: (name) => setCharacters(prev => [...prev, name]),
            },
            {
              name: "Items",
              icon: <Backpack className="h-4 w-4" />,
              items: items.map(i => ({ label: i })),
              onCreate: (name) => setItems(prev => [...prev, name]),
            },
          ]}
        />
      </Modal>

      <Modal isOpen={!!pendingAddScene} onClose={() => setPendingAddScene(null)}>
        <div className="bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 p-6 w-80 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-gold-400 font-medium">Add to Campaign</p>
            <p className="text-gold-600 text-sm">
              Select a campaign for <span className="text-gold-300">"{pendingAddScene?.name}"</span>
            </p>
          </div>
          {savedCampaigns.length > 0 ? (
            <div className="flex flex-col gap-1">
              {savedCampaigns.map(campaign => {
                const alreadyAdded = campaign.scenes?.includes(pendingAddScene?.id ?? "");
                return (
                  <button
                    key={campaign.id}
                    onClick={() => !alreadyAdded && addSceneToCampaign(campaign)}
                    className={`w-full! text-left! px-3! py-2! text-sm! rounded-md! justify-start! ${alreadyAdded ? "opacity-40 cursor-not-allowed!" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: campaign.color }} />
                      {campaign.title}
                      {alreadyAdded && <span className="text-gold-700 text-xs ml-auto">already added</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-gold-700 text-sm">No campaigns yet. Create one first.</p>
          )}
          <button className="w-full! text-center" onClick={() => setPendingAddScene(null)}>
            Cancel
          </button>
        </div>
      </Modal>
    </>
  );
}
