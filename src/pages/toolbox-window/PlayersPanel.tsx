import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { FolderPlus, Plus, Trash2, User, X } from "lucide-react";
import type { Campaign, CharacterGroup } from "../../components/campaign/CampaignSelector";
import type { Character } from "../character/character-editor";
import { broadcastCampaignUpdated, requestCharacterSelect } from "../../lib/appEvents";

interface Props {
  campaign: Campaign;
}

export default function PlayersPanel({ campaign }: Props) {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    invoke<Character[]>("list_characters").then(setCharacters).catch(() => {});
  }, []);

  const players = characters.filter(c => c.type === "player");
  const groups = campaign.characterGroups ?? [];
  const groupedIds = new Set(groups.flatMap(g => g.characterIds));
  const ungrouped = players.filter(c => !groupedIds.has(c.id));

  const persistGroups = (updated: CharacterGroup[]) => {
    const updatedCampaign = { ...campaign, characterGroups: updated };
    invoke("save_campaign", { campaign: updatedCampaign })
      .then(() => broadcastCampaignUpdated(updatedCampaign))
      .catch(() => {});
  };

  const createGroup = () => {
    const group: CharacterGroup = { id: crypto.randomUUID(), name: "New Group", characterIds: [] };
    persistGroups([...groups, group]);
    setRenamingGroupId(group.id);
    setRenameValue(group.name);
  };

  const commitRename = (id: string, name: string) => {
    const trimmed = name.trim();
    if (trimmed) persistGroups(groups.map(g => (g.id === id ? { ...g, name: trimmed } : g)));
    setRenamingGroupId(null);
  };

  const deleteGroup = (id: string) => {
    persistGroups(groups.filter(g => g.id !== id));
  };

  // A character belongs to at most one group; moving it clears any prior membership.
  const moveToGroup = (characterId: string, groupId: string | null) => {
    const updated = groups.map(g => ({ ...g, characterIds: g.characterIds.filter(id => id !== characterId) }));
    if (groupId) {
      const target = updated.find(g => g.id === groupId);
      if (target) target.characterIds = [...target.characterIds, characterId];
    }
    persistGroups(updated);
  };

  const onCardDragStart = (e: React.DragEvent, character: Character) => {
    e.dataTransfer.setData("application/json", JSON.stringify(character));
    e.dataTransfer.effectAllowed = "copy";
  };

  const onGroupDrop = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      if (parsed.id) moveToGroup(parsed.id, groupId);
    } catch { /* ignore */ }
  };

  return (
    <div className="w-56 h-full shrink-0 border-r border-gold-500/20 flex flex-col bg-surface/20">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gold-500/20 shrink-0">
        <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">Players</span>
        <div className="flex items-center gap-1">
          <button onClick={createGroup} className="p-1 text-gold-600 hover:text-gold-300 transition-colors" title="New group">
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => navigate("/character-editor")} className="p-1 text-gold-600 hover:text-gold-300 transition-colors" title="New player">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3">
        {players.length === 0 && (
          <p className="text-gold-700 text-xs">No players created yet.</p>
        )}

        {groups.map(group => {
          const members = players.filter(c => group.characterIds.includes(c.id));
          return (
            <div
              key={group.id}
              className="flex flex-col gap-1.5 rounded-lg border border-gold-500/15 p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onGroupDrop(e, group.id)}
            >
              <div className="flex items-center justify-between gap-1">
                {renamingGroupId === group.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(group.id, renameValue)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(group.id, renameValue);
                      if (e.key === "Escape") setRenamingGroupId(null);
                    }}
                    className="bg-base border border-gold-500/40 rounded px-1.5 py-0.5 text-xs text-gold-200 flex-1 min-w-0"
                  />
                ) : (
                  <span
                    className="text-gold-300 text-xs font-medium truncate cursor-text"
                    onDoubleClick={() => { setRenamingGroupId(group.id); setRenameValue(group.name); }}
                    title="Double-click to rename"
                  >
                    {group.name}
                  </span>
                )}
                <button onClick={() => deleteGroup(group.id)} className="p-0.5 text-gold-700 hover:text-red-400 transition-colors shrink-0" title="Delete group">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {members.length === 0 && (
                  <p className="text-gold-800 text-[10px] italic">Drag players here</p>
                )}
                {members.map(c => (
                  <PlayerCard
                    key={c.id}
                    character={c}
                    onDragStart={(e) => onCardDragStart(e, c)}
                    onClick={() => requestCharacterSelect(c)}
                    onRemove={() => moveToGroup(c.id, null)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div
          className="flex flex-col gap-1.5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onGroupDrop(e, null)}
        >
          {groups.length > 0 && (
            <span className="text-gold-700 text-[10px] font-semibold uppercase tracking-wider">Ungrouped</span>
          )}
          <div className="flex flex-col gap-1">
            {ungrouped.map(c => (
              <PlayerCard
                key={c.id}
                character={c}
                onDragStart={(e) => onCardDragStart(e, c)}
                onClick={() => requestCharacterSelect(c)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 py-2 border-t border-gold-500/20 shrink-0">
        <p className="text-gold-800 text-[9px]">Drag a player onto a scene in Maps to add them there. Click to drop at the active scene's center.</p>
      </div>
    </div>
  );
}

function PlayerCard({ character, onDragStart, onClick, onRemove }: {
  character: Character;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gold-500/20 bg-surface/40 cursor-grab active:cursor-grabbing hover:border-gold-500/40 transition-colors select-none"
      title="Drag onto a scene to add there, or click to drop at the active scene's center"
    >
      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gold-500/30 bg-base flex items-center justify-center">
        {character.image ? (
          <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
        ) : (
          <User className="h-3.5 w-3.5 text-gold-700" />
        )}
      </div>
      <span className="text-gold-300 text-xs font-medium truncate flex-1 min-w-0">{character.name || "Unnamed"}</span>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-gold-700 hover:text-red-400 transition-opacity shrink-0"
          title="Remove from group"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
