import { Backpack, Map, Menu, Pin, User } from "lucide-react";
import {Dropdown, Option} from "../../components/ui/dropdown/Dropdown";
import Button from "../../components/ui/buttons/BaseButton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import Card from "../../components/ui/card/card";
import HexGrid from "../../components/game/HexGrid";
import SceneEditor, { Scene } from "../../components/game/SceneEditor";

import kelsierImg from "../../assets/Characters/kelsier.jpg";
import sazedImg from "../../assets/Characters/sazed.jpg";
import vinImg from "../../assets/Characters/vin.jpg";
import Tooltip from "../../components/ui/tooltip/Tooltip";
import Modal from "../../components/ui/modal/Modal";
import SearchBar from "../../components/ui/searchbar/SearchBar";

interface Player {
  name: string;
  img: string;
  stats: Record<string, number>;
  description: string;
}

interface SavedScene {
  id: string;
  name: string;
  gridType: string;
  cols: number;
  rows: number;
  disabledCells: string[];
}

export default function Play() {
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [pinnedPlayer, setPinnedPlayer] = useState<Player | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([]);
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [characters, setCharacters] = useState<string[]>(["Kelsier", "Vin", "Sazed"]);
  const [items, setItems] = useState<string[]>(["Health Potion", "Iron Sword", "Leather Armor", "Magic Scroll"]);
  const navigate = useNavigate();

  useEffect(() => {
    invoke<SavedScene[]>("list_scenes").then(setSavedScenes).catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const players = [
    {
      name: "Kelsier",
      img: kelsierImg,
      stats: {
        STR: 2,
        DEX: 1,
        CON: 3,
        INT: 0,
        WIS: 0,
        CHA: 4
      },
      description: "The charismatic leader of a group of thieves, known for his cunning and bravery." 
    },
    {
      name: "Vin",
      img: vinImg,
      stats: {
        STR: 1,
        DEX: 3,
        CON: 2,
        INT: 1,
        WIS: 0,
        CHA: 3
      },
      description: "A skilled street thief with a mysterious past, who discovers her own powers and becomes a key member of Kelsier's crew."
    },
    {
      name: "Sazed",
      img: sazedImg,
      stats: {
        STR: 0,
        DEX: 1,
        CON: 2,
        INT: 4,
        WIS: 3,
        CHA: 0
      },
      description: "A scholar and keeper of knowledge, who serves as the crew's historian and has a deep understanding of the world's religions and magic."
    }
  ]

  return (
    <main className="h-full min-w-screen bg-base flex justify-center items-center">
      {activeScene ? (
        <SceneEditor scene={activeScene} onChange={setActiveScene} />
      ) : (
        <HexGrid gridType="hex" />
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <SearchBar
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            categories={[
              {
                name: "Scenes",
                icon: <Map className="h-4 w-4" />,
                items: savedScenes.map(s => ({ label: s.name, id: s.id })),
                onCreate: (name) => { setModalOpen(false); navigate("/scene-editor", { state: { name } }); },
                onSelect: (item) => {
                  const scene = savedScenes.find(s => s.id === item.id);
                  if (scene) { setModalOpen(false); navigate("/scene-editor", { state: { existing: scene } }); }
                },
              },
              { name: "Characters", icon: <User className="h-4 w-4" />, items: characters.map(c => ({ label: c })), onCreate: (name) => setCharacters(prev => [...prev, name]) },
              { name: "Items", icon: <Backpack className="h-4 w-4" />, items: items.map(i => ({ label: i })), onCreate: (name) => setItems(prev => [...prev, name]) },
            ]}
          />
      </Modal>
      <div className="absolute w-full h-full flex flex-row justify-between pointer-events-none">
        
        <div className="flex flex-col justify-between w-full h-full p-4">
          <div className="pointer-events-auto">
            <ExpandableMenu 
              MainButton={{ MainComponent: <Menu /> }}
              Options={[
                { label: "Settings", onClick: () => alert("Settings clicked") },
                { label: "Exit", onClick: () => navigate("/campaign"), className: "text-red-300" }
              ]}
            />
          </div>      
          <div className="flex justify-between items-end pointer-events-auto">
            <div className="flex flex-row gap-2"
              onMouseLeave={() => { if (!pinnedPlayer) setHoveredPlayer(null); }}
            >
              {
                players.map((player, index) => (
                  <PlayerSelector
                    key={index}
                    player={player}
                    isPinned={pinnedPlayer?.name === player.name}
                    onHover={() => setHoveredPlayer(player)}
                    onClick={() => {
                      if (pinnedPlayer?.name === player.name) {
                        setPinnedPlayer(null);
                        setHoveredPlayer(null);
                      } else {
                        setPinnedPlayer(player);
                        setHoveredPlayer(player);
                      }
                    }}
                  />
                ))
              }
            </div>
            {(pinnedPlayer || hoveredPlayer) && <StatCard player={(pinnedPlayer || hoveredPlayer)!} />}
          </div>
        </div>
      </div>
    </main>
  );
}

function ExpandableMenu(
  {
    MainButton,
    Options
  }: {
    MainButton: {
      MainComponent: React.ReactNode
      className?: string
    }
    Options: { label: string, onClick: () => void, className?: string }[]
  }
) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <Button onClick={() => setIsOpen(!isOpen)} className={MainButton.className}>
        {MainButton.MainComponent}
      </Button>
      {isOpen && <Dropdown >
          {Options.map((option, index) => (
            <Option key={index} onClick={option.onClick} className={option.className}>
              {option.label}
            </Option>
          ))}
        </Dropdown>}
    </div>
  );
}

function PlayerSelector({player, isPinned, onHover, onClick}: {player: Player, isPinned: boolean, onHover: () => void, onClick: () => void}) {
  return (
    <div
      className={`relative flex flex-col gap-2 h-30 w-10 rounded-lg overflow-hidden border transition-colors cursor-pointer ${isPinned ? 'border-gold-400' : 'border-transparent hover:border-gold-500'}`}
      onMouseEnter={onHover}
      onClick={onClick}
    >
      <img src={player.img} alt={player.name} className="h-full w-full object-cover" />
      {isPinned && (
        <div className="absolute top-1 right-1">
          <Pin size={12} className="text-gold-400" />
        </div>
      )}
    </div>
  );
}

function StatCard({player}: {player: Player}) {
  return (
    <div className="relative flex flex-row gap-2 h-60">
      <Card className="grid grid-cols-2 bg-surface border border-gold-500 p-2 rounded-lg">
        <Tooltip text="Strength">
          <Stat label="STR" value={player.stats.STR.toString()} />
        </Tooltip>
        <Tooltip text="Dexterity">
          <Stat label="DEX" value={player.stats.DEX.toString()} />
        </Tooltip>
        <Tooltip text="Constitution">
          <Stat label="CON" value={player.stats.CON.toString()} />
        </Tooltip>
        <Tooltip text="Intelligence">
          <Stat label="INT" value={player.stats.INT.toString()} />
        </Tooltip>
        <Tooltip text="Wisdom">
          <Stat label="WIS" value={player.stats.WIS.toString()} />
        </Tooltip>
        <Tooltip text="Charisma">
          <Stat label="CHA" value={player.stats.CHA.toString()} />
        </Tooltip>
      </Card>
      <div className="h-full flex flex-col">
        <Card className="w-60 h-full">
          <p className="font-bold text-lg">{player.name}</p>
          <hr className="border-gold-500/30 mb-2" />
          <p>{player.description}</p>
        </Card>
      </div>

      <div className="h-60 w-30 rounded-lg overflow-hidden border border-transparent">
        <img src={player.img} alt={player.name} className="h-full w-full object-cover" />
      </div>
    </div>

  );
}

function Stat({label, value}: {label: string, value: string}) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 hover:bg-gold-500/10 rounded-md transition-colors cursor-pointer">
      <p className="text-sm text-gold-300">{label}</p>
      <p className="text-lg font-bold text-gold-500">{value}</p>
    </div>
  );
}