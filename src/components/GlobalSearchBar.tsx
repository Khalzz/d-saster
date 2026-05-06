import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Backpack, ImagePlus, Map, User, X } from "lucide-react";
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

export default function GlobalSearchBar({ activeCampaign }: { activeCampaign?: Campaign | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([]);
  const [savedCampaigns, setSavedCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<string[]>(["Kelsier", "Vin", "Sazed"]);
  const [items, setItems] = useState<string[]>(["Health Potion", "Iron Sword", "Leather Armor", "Magic Scroll"]);
  const [pendingAddScene, setPendingAddScene] = useState<SavedScene | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneBg, setNewSceneBg] = useState<string | undefined>(undefined);
  const createBgInputRef = useRef<HTMLInputElement>(null);
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

  const addSceneToCampaign = (campaign: Campaign, scene?: SavedScene) => {
    const target = scene ?? pendingAddScene;
    if (!target) return;
    const sceneIds = campaign.scenes ?? [];
    if (sceneIds.includes(target.id)) { setPendingAddScene(null); return; }
    const updated: Campaign = { ...campaign, scenes: [...sceneIds, target.id] };
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
              onCreate: (name) => { setIsOpen(false); setNewSceneName(name); setNewSceneBg(undefined); setShowCreateModal(true); },
              onSelect: (item) => {
                const scene = savedScenes.find(s => s.id === item.id);
                if (scene) {
                  setIsOpen(false);
                  if (activeCampaign) {
                    addSceneToCampaign(activeCampaign, scene);
                  } else {
                    setPendingAddScene(scene);
                  }
                }
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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 p-6 w-96 flex flex-col gap-4">
          <p className="text-gold-400 font-medium">Create Scene</p>
          <div className="flex flex-col gap-1">
            <label className="text-gold-600 text-xs">Name</label>
            <input
              autoFocus
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSceneName.trim()) {
                  setShowCreateModal(false);
                  navigate("/scene-editor", { state: { name: newSceneName.trim(), bg: newSceneBg } });
                }
              }}
              className="w-full! text-sm!"
              placeholder="Scene name"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-gold-600 text-xs">Background Image (optional)</label>
            <input
              ref={createBgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setNewSceneBg(ev.target?.result as string);
                reader.readAsDataURL(file);
                e.target.value = "";
              }}
            />
            {newSceneBg ? (
              <div className="relative w-full h-28 rounded-md overflow-hidden border border-gold-500/30">
                <img src={newSceneBg} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setNewSceneBg(undefined)}
                  className="absolute top-1 right-1 w-6! h-6! p-0! flex items-center justify-center bg-black/60 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => createBgInputRef.current?.click()}
                className="w-full! h-28! flex! flex-col! items-center! justify-center! gap-1! border! border-dashed! border-gold-500/30! rounded-md! text-gold-600!"
              >
                <ImagePlus size={20} />
                <span className="text-xs">Click to upload</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <button className="flex-1! text-center" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button
              className="flex-1! text-center! bg-gold-500! text-gold-900!"
              onClick={() => {
                if (!newSceneName.trim()) return;
                setShowCreateModal(false);
                navigate("/scene-editor", { state: { name: newSceneName.trim(), bg: newSceneBg } });
              }}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
