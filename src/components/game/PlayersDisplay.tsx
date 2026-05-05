import { useState } from "react";
import { Pin } from "lucide-react";
import Card from "../ui/card/card";
import Tooltip from "../ui/tooltip/Tooltip";
import kelsierImg from "../../assets/Characters/kelsier.jpg";
import sazedImg from "../../assets/Characters/sazed.jpg";
import vinImg from "../../assets/Characters/vin.jpg";

interface Player {
  name: string;
  img: string;
  stats: Record<string, number>;
  description: string;
}

export default function PlayersDisplay() {
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [pinnedPlayer, setPinnedPlayer] = useState<Player | null>(null);

  const players: Player[] = [
    {
      name: "Kelsier",
      img: kelsierImg,
      stats: { STR: 2, DEX: 1, CON: 3, INT: 0, WIS: 0, CHA: 4 },
      description: "The charismatic leader of a group of thieves, known for his cunning and bravery.",
    },
    {
      name: "Vin",
      img: vinImg,
      stats: { STR: 1, DEX: 3, CON: 2, INT: 1, WIS: 0, CHA: 3 },
      description: "A skilled street thief with a mysterious past, who discovers her own powers and becomes a key member of Kelsier's crew.",
    },
    {
      name: "Sazed",
      img: sazedImg,
      stats: { STR: 0, DEX: 1, CON: 2, INT: 4, WIS: 3, CHA: 0 },
      description: "A scholar and keeper of knowledge, who serves as the crew's historian and has a deep understanding of the world's religions and magic.",
    },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {(pinnedPlayer || hoveredPlayer) && <StatCard player={(pinnedPlayer || hoveredPlayer)!} />}
      <div
        className="flex flex-row gap-2"
        onMouseLeave={() => { if (!pinnedPlayer) setHoveredPlayer(null); }}
      >

        {players.map((player, index) => (
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
        ))}
      </div>
    </div>
  );
}

function PlayerSelector({ player, isPinned, onHover, onClick }: { player: Player; isPinned: boolean; onHover: () => void; onClick: () => void }) {
  return (
    <button
      className={`relative flex flex-col gap-2 h-30 w-10 rounded-lg overflow-hidden border transition-colors cursor-pointer ${isPinned ? "border-gold-400" : "border-transparent hover:border-gold-500"}`}
      onMouseEnter={onHover}
      onClick={onClick}
    >
      <img src={player.img} alt={player.name} className="h-full w-full object-cover" />
      {isPinned && (
        <div className="absolute top-1 right-1">
          <Pin size={12} className="text-gold-400" />
        </div>
      )}
    </button>
  );
}

function StatCard({ player }: { player: Player }) {
  return (
    <div className="relative flex flex-row gap-2 h-60 pointer-events-auto">
      <Card className="grid grid-cols-2 bg-surface border border-gold-500 p-2 rounded-lg">
        <Tooltip text="Strength"><Stat label="STR" value={player.stats.STR.toString()} /></Tooltip>
        <Tooltip text="Dexterity"><Stat label="DEX" value={player.stats.DEX.toString()} /></Tooltip>
        <Tooltip text="Constitution"><Stat label="CON" value={player.stats.CON.toString()} /></Tooltip>
        <Tooltip text="Intelligence"><Stat label="INT" value={player.stats.INT.toString()} /></Tooltip>
        <Tooltip text="Wisdom"><Stat label="WIS" value={player.stats.WIS.toString()} /></Tooltip>
        <Tooltip text="Charisma"><Stat label="CHA" value={player.stats.CHA.toString()} /></Tooltip>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 hover:bg-gold-500/10 rounded-md transition-colors cursor-pointer">
      <p className="text-sm text-gold-300">{label}</p>
      <p className="text-lg font-bold text-gold-500">{value}</p>
    </div>
  );
}