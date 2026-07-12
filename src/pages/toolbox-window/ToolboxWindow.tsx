import { Backpack, Map, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Campaign } from "../../components/campaign/CampaignSelector";
import type { Character } from "../character/character-editor";
import type { Scene } from "../../components/game/SceneEditor";
import SceneMapCanvas from "../../components/game/SceneMapCanvas";
import { onActiveSceneChanged, onCampaignUpdated, requestCharacterSelect, requestSceneSelect } from "../../lib/appEvents";
import { Tabs } from "../../components/ui/tabs/Tabs";
import PlayersPanel from "./PlayersPanel";

export default function ToolboxWindow() {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  // Cold-start load: fetch from disk once
  useEffect(() => {
    if (!campaignId) return;
    invoke<Campaign[]>("list_campaigns")
      .then(all => setCampaign(all.find(c => c.id === campaignId) ?? null))
      .catch(() => {});
  }, [campaignId]);

  // Live updates: applied directly from the broadcasted campaign, no disk read
  useEffect(() => {
    if (!campaignId) return;
    const unlisten = onCampaignUpdated((camp) => {
      if (camp.id === campaignId) setCampaign(camp);
    });
    return () => { unlisten.then(u => u()); };
  }, [campaignId]);

  useEffect(() => {
    setActiveSceneId(campaign?.lastActiveScene ?? null);
  }, [campaign]);

  useEffect(() => {
    const unlisten = onActiveSceneChanged(setActiveSceneId);
    return () => { unlisten.then(u => u()); };
  }, []);

  // Flip the "Active" badge the moment a scene is picked, instead of waiting
  // for the play window to confirm the switch is done
  const handleSceneSelect = (scene: Scene) => {
    setActiveSceneId(scene.id);
    requestSceneSelect(scene);
  };

  if (!campaign) return (
    <div className="w-full h-full flex items-center justify-center bg-base">
      <p className="text-gold-700 text-sm">No campaign loaded.</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-row bg-base">
      <PlayersPanel campaign={campaign} />
      <Tabs
        className="flex-1 min-w-0 h-full"
        tabs={[
          {
            id: "maps",
            label: "Maps",
            icon: <Map className="h-3.5 w-3.5" />,
            content: (
              <SceneMapCanvas
                campaign={campaign}
                activeSceneId={activeSceneId}
                onSceneSelect={handleSceneSelect}
              />
            ),
          },
          {
            id: "characters",
            label: "Characters",
            icon: <User className="h-3.5 w-3.5" />,
            content: <ToolboxCharacters />,
          },
          {
            id: "items",
            label: "Items",
            icon: <Backpack className="h-3.5 w-3.5" />,
            content: (
              <div className="w-full h-full overflow-y-auto p-4">
                <p className="text-gold-700 text-xs">No items added yet.</p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function ToolboxCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    invoke<Character[]>("list_characters").then(setCharacters).catch(() => {});
  }, []);

  const players = characters.filter(c => c.type === "player");
  const npcs = characters.filter(c => c.type === "npc");

  return (
    <div className="w-full h-full overflow-y-auto p-4 flex flex-col gap-4">
      {characters.length === 0 && (
        <p className="text-gold-700 text-xs">No characters created yet.</p>
      )}

      {players.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">Players</span>
          <div className="flex flex-col gap-1">
            {players.map(c => (
              <ToolboxCharacterItem key={c.id} character={c} onClick={requestCharacterSelect} />
            ))}
          </div>
        </div>
      )}

      {npcs.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-gold-600 text-xs font-semibold uppercase tracking-wider">NPCs</span>
          <div className="flex flex-col gap-1">
            {npcs.map(c => (
              <ToolboxCharacterItem key={c.id} character={c} onClick={requestCharacterSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolboxCharacterItem({ character, onClick }: { character: Character; onClick: (character: Character) => void }) {
  return (
    <div
      onClick={() => onClick(character)}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-gold-500/20 bg-surface/40 cursor-pointer hover:border-gold-500/40 transition-colors select-none"
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
