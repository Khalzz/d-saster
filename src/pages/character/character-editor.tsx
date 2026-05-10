import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ChevronLeft, UserRound, Sword, ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";

export interface CharacterStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  origin: string;
  race: string;
  image?: string;
  type: "player" | "npc";
  stats: CharacterStats;
}

const DEFAULT_STATS: CharacterStats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
const STAT_KEYS: (keyof CharacterStats)[] = ["str", "dex", "con", "int", "wis", "cha"];
const STAT_LABELS: Record<keyof CharacterStats, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
};

function modifier(val: number) {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharacterEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { existing?: Character } | null;
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [char, setChar] = useState<Character>(() =>
    state?.existing ?? {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      origin: "",
      race: "",
      type: "player",
      stats: { ...DEFAULT_STATS },
    }
  );

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setChar(c => ({ ...c, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const setStat = (key: keyof CharacterStats, raw: string) => {
    const val = Math.max(1, Math.min(30, parseInt(raw) || 1));
    setChar(c => ({ ...c, stats: { ...c.stats, [key]: val } }));
  };

  const handleSave = async () => {
    if (!char.name.trim()) { toast.error("Name is required"); return; }
    await invoke("save_character", { character: { ...char, name: char.name.trim() } }).catch(() => {});
    toast.success("Character saved");
    navigate(-1);
  };

  return (
    <main className="h-full min-h-screen bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
        <button className="w-9! h-9! flex items-center justify-center" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-gold-400 font-semibold text-sm">
          {state?.existing ? "Edit Character" : "New Character"}
        </h1>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 flex gap-6 max-w-4xl mx-auto w-full">

        {/* Left column — portrait + type */}
        <div className="flex flex-col gap-4 w-52 shrink-0">
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

          {/* Portrait */}
          <div
            className="w-full aspect-square rounded-xl border border-gold-500/30 bg-surface overflow-hidden flex flex-col items-center justify-center cursor-pointer relative group hover:border-gold-500/70 transition-colors"
            onClick={() => imgInputRef.current?.click()}
          >
            {char.image ? (
              <>
                <img src={char.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <ImagePlus className="h-5 w-5 text-gold-400" />
                  <span className="text-gold-400 text-xs">Replace</span>
                </div>
                <button
                  className="absolute top-1.5 right-1.5 w-6! h-6! min-w-0! p-0! opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setChar(c => ({ ...c, image: undefined })); }}
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gold-700 group-hover:text-gold-500 transition-colors pointer-events-none">
                <UserRound className="h-10 w-10" />
                <span className="text-xs">Add portrait</span>
              </div>
            )}
          </div>

          {/* Player / NPC toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gold-500/40">
            <button
              className={`flex-1! h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 ${char.type === "player" ? "bg-gold-500! text-gray-900!" : "bg-transparent! text-gold-500! hover:bg-gold-500/10!"}`}
              onClick={() => setChar(c => ({ ...c, type: "player" }))}
            >
              <UserRound className="h-3.5 w-3.5" /> Player
            </button>
            <div className="w-px bg-gold-500/40 shrink-0" />
            <button
              className={`flex-1! h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 ${char.type === "npc" ? "bg-gold-500! text-gray-900!" : "bg-transparent! text-gold-500! hover:bg-gold-500/10!"}`}
              onClick={() => setChar(c => ({ ...c, type: "npc" }))}
            >
              <Sword className="h-3.5 w-3.5" /> NPC
            </button>
          </div>
        </div>

        {/* Right column — fields + stats */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Basic info */}
          <div className="bg-surface border border-gold-500/30 rounded-xl p-4 flex flex-col gap-3">
            <Field label="Name">
              <input
                className="field-input"
                value={char.name}
                onChange={(e) => setChar(c => ({ ...c, name: e.target.value }))}
                placeholder="Character name"
              />
            </Field>
            <div className="flex gap-3">
              <Field label="Race" className="flex-1">
                <input
                  className="field-input"
                  value={char.race}
                  onChange={(e) => setChar(c => ({ ...c, race: e.target.value }))}
                  placeholder="Human, Elf, Dwarf…"
                />
              </Field>
              <Field label="Origin" className="flex-1">
                <input
                  className="field-input"
                  value={char.origin}
                  onChange={(e) => setChar(c => ({ ...c, origin: e.target.value }))}
                  placeholder="Acolyte, Soldier…"
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                className="field-input resize-none"
                rows={4}
                value={char.description}
                onChange={(e) => setChar(c => ({ ...c, description: e.target.value }))}
                placeholder="Background, appearance, personality…"
              />
            </Field>
          </div>

          {/* Ability scores */}
          <div className="bg-surface border border-gold-500/30 rounded-xl p-4 flex flex-col gap-3">
            <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">Ability Scores</span>
            <div className="grid grid-cols-6 gap-2">
              {STAT_KEYS.map(key => {
                const mod = Math.floor((char.stats[key] - 10) / 2);
                return (
                  <div key={key} className="flex flex-col items-center gap-1 bg-base border border-gold-500/20 rounded-lg py-2.5 px-1">
                    <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider">{STAT_LABELS[key]}</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={char.stats[key]}
                      onChange={(e) => setStat(key, e.target.value)}
                      className="w-full text-center bg-transparent outline-none text-gold-200 text-xl font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className={`text-[10px] font-semibold ${mod >= 0 ? "text-gold-500" : "text-red-400"}`}>
                      {modifier(char.stats[key])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              className="px-5 h-9! text-xs! border-gold-500/30! text-gold-500!"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              className="px-5 h-9! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
              onClick={handleSave}
            >
              Save Character
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
