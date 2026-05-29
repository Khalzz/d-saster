import { useEffect, useState } from "react";
import { Pencil, Pin, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import Card from "../ui/card/card";
import type { Character, CharacterClass } from "../../pages/character/character-editor";
import type { Ruleset, StatDefinition } from "../../pages/ruleset/ruleset-editor";
import { calcModifier } from "../../pages/character/components/StatCell";
import { calcSkill } from "../../pages/character/components/SkillCell";

interface Props {
  characters: Character[];
}

const DEFAULT_STAT_DEFS: StatDefinition[] = [
  { key: "str", label: "STR", description: "" },
  { key: "dex", label: "DEX", description: "" },
  { key: "con", label: "CON", description: "" },
  { key: "int", label: "INT", description: "" },
  { key: "wis", label: "WIS", description: "" },
  { key: "cha", label: "CHA", description: "" },
];

export default function PlayersDisplay({ characters }: Props) {
  const navigate = useNavigate();
  const [hoveredChar, setHoveredChar] = useState<Character | null>(null);
  const [pinnedChar, setPinnedChar] = useState<Character | null>(null);
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [contextMenu, setContextMenu] = useState<{ character: Character; x: number; y: number } | null>(null);

  useEffect(() => {
    invoke<Ruleset[]>("list_rulesets").then(setRulesets).catch(() => {});
    invoke<CharacterClass[]>("list_classes").then(setClasses).catch(() => {});
  }, []);

  if (characters.length === 0) return null;

  const displayed = pinnedChar || hoveredChar;

  return (
    <div className="flex flex-col gap-2 w-full">
      {displayed && (
        <CharacterInfoCard
          character={displayed}
          rulesets={rulesets}
          classes={classes}
        />
      )}
      <div
        className="flex flex-row gap-2"
        onMouseLeave={() => { if (!pinnedChar) setHoveredChar(null); }}
      >
        {characters.map(character => (
          <CharacterAvatar
            key={character.id}
            character={character}
            isPinned={pinnedChar?.id === character.id}
            onHover={() => setHoveredChar(character)}
            onClick={() => {
              if (pinnedChar?.id === character.id) {
                setPinnedChar(null);
                setHoveredChar(null);
              } else {
                setPinnedChar(character);
                setHoveredChar(character);
                window.dispatchEvent(new CustomEvent("center-on-character", { detail: character }));
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ character, x: e.clientX, y: e.clientY });
            }}
          />
        ))}
      </div>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-surface border border-gold-500/40 rounded-lg shadow-xl overflow-hidden pointer-events-auto"
            style={{ left: contextMenu.x, top: contextMenu.y, transform: 'translateY(-100%)' }}
          >
            <button
              className="w-full! px-3! py-2! text-xs! text-gold-300! hover:bg-gold-500/10! bg-transparent! border-0! rounded-none! flex items-center gap-2"
              onClick={() => {
                navigate("/character-editor", { state: { existing: contextMenu.character } });
                setContextMenu(null);
              }}
            >
              <Pencil className="h-3 w-3" /> Edit Character
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CharacterAvatar({ character, isPinned, onHover, onClick, onContextMenu }: {
  character: Character;
  isPinned: boolean;
  onHover: () => void;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      className={`relative flex flex-col gap-2 h-30 w-10 rounded-lg overflow-hidden border transition-colors cursor-pointer pointer-events-auto ${isPinned ? "border-gold-400" : "border-transparent hover:border-gold-500"}`}
      onMouseEnter={onHover}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {character.image ? (
        <img src={character.image} alt={character.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-surface flex items-center justify-center">
          <User className="h-5 w-5 text-gold-700" />
        </div>
      )}
      {isPinned && (
        <div className="absolute top-1 right-1">
          <Pin size={12} className="text-gold-400" />
        </div>
      )}
    </button>
  );
}

function CharacterInfoCard({ character, rulesets, classes }: {
  character: Character;
  rulesets: Ruleset[];
  classes: CharacterClass[];
}) {
  const ruleset = rulesets.find(r => r.id === character.rulesetId);
  const statDefs = ruleset?.stats.length ? ruleset.stats : DEFAULT_STAT_DEFS;
  const activeClasses = ruleset ? ruleset.classes : classes;
  const selectedClass = activeClasses.find(c => c.id === character.classId);

  const modifierFormula = ruleset?.modifierFormula;
  const savingThrowFormula = ruleset?.savingThrowFormula || "{{stat_mod}}";
  const skillFormula = ruleset?.skillFormula;
  const skills = ruleset?.skills ?? [];

  return (
    <div className="relative flex flex-row gap-2 pointer-events-auto bg-surface p-2 rounded-lg border border-gold-500/30">
      {/* Left column: Portrait + Stats + Saving Throws */}
      <div className="flex flex-col gap-2 shrink-0 w-32">
        {character.image && (
          <div className="w-full aspect-square rounded-lg overflow-hidden border border-gold-500/30">
            <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
          </div>
        )}

        <Card className="p-1.5">
          <p className="text-[7px] text-gold-700 uppercase tracking-wider leading-none">Stats</p>
          <div className="grid grid-cols-3 gap-0.5">
            {statDefs.map(def => {
              const val = character.stats[def.key] ?? 10;
              const mod = calcModifier(val, modifierFormula);
              return (
                <div
                  key={def.key}
                  className="flex flex-col items-center py-0.5 rounded"
                  title={`${def.label} — ${val} pts (${mod})`}
                >
                  <span className="text-[9px] text-gold-600 uppercase">{def.label.slice(0, 3)}</span>
                  <span className="text-xs font-semibold text-gold-300">{mod}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-1.5">
          <p className="text-[7px] text-gold-700 uppercase tracking-wider leading-none">Saving Throws</p>
          <div className="grid grid-cols-3 gap-0.5">
            {statDefs.map(def => {
              const value = calcSkill(savingThrowFormula, character.stats[def.key] ?? 10, modifierFormula, character.proficiencyBonus, character.level);
              return (
                <div key={def.key} className="flex flex-col items-center py-0.5">
                  <span className="text-[9px] text-gold-600 uppercase">{def.label.slice(0, 3)}</span>
                  <span className="text-xs font-semibold text-gold-300">{value}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Right column: Character info + bottom row */}
      <div className="flex flex-col gap-2 w-96">
        {/* Character info */}
        <Card className="p-2">
          <div className="flex items-baseline justify-between">
            <p className="font-bold text-sm text-gold-300">{character.name}</p>
            <span className="text-[10px] text-gold-300">Lv. {character.level}</span>
          </div>
          <div className="flex gap-2 text-[10px] text-gold-600">
            {character.race && <span>{character.race}</span>}
            {character.origin && <span>· {character.origin}</span>}
            {selectedClass && <span>· {selectedClass.name}</span>}
          </div>
          {selectedClass?.modifiers?.length > 0 && (
            <p className="text-[10px] text-gold-600 mt-0.5">
              {selectedClass.modifiers.map(m => `${m.name} ${m.value >= 0 ? "+" : ""}${m.value}`).join(" · ")}
            </p>
          )}
          {character.description && (
            <>
              <hr className="border-gold-500/20 mb-1.5" />
              <p className="text-gold-500 text-xs leading-relaxed line-clamp-3">{character.description}</p>
            </>
          )}
        </Card>

        {/* Bottom row: Skills (left) + Inspiration/Combat (right) */}
        <div className="flex flex-row gap-2">
          {/* Left: Skills in 2 columns */}
          {skills.length > 0 && skillFormula && (
            <Card className="p-2 flex-1">
              <p className="text-[7px] text-gold-700 uppercase tracking-wider leading-none mb-1">Skills</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                {skills.map(skill => {
                  const proficient = character.skillProficiencies?.[skill.id] ?? false;
                  const bonus = proficient ? character.proficiencyBonus : 0;
                  const value = calcSkill(skillFormula, character.stats[skill.statKey] ?? 10, modifierFormula, bonus, character.level);
                  return (
                    <div key={skill.id} className="flex items-center justify-between gap-1 px-0.5 py-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${proficient ? "bg-gold-400" : "bg-gold-500/20"}`} />
                        <span className="text-[10px] text-gold-300 whitespace-nowrap">{skill.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-gold-300 shrink-0">{value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Right: Inspiration + Prof Bonus + Combat */}
          <div className="flex flex-col gap-2 shrink-0">
            <Card className="p-2 flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gold-600 uppercase">Inspiration</span>
                <span className="text-xs font-semibold text-gold-300">{character.inspiration}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gold-600 uppercase">Prof. Bonus</span>
                <span className="text-xs font-semibold text-gold-300">+{character.proficiencyBonus}</span>
              </div>
            </Card>

            <Card className="p-2">
              <p className="text-[7px] text-gold-700 uppercase tracking-wider leading-none mb-1">Combat</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-gold-600 uppercase">AC</span>
                  <span className="text-xs font-semibold text-gold-300">{character.armorClass ?? 10}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-gold-600 uppercase">Init</span>
                  <span className="text-xs font-semibold text-gold-300">{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-gold-600 uppercase">Speed</span>
                  <span className="text-xs font-semibold text-gold-300">{character.speed ?? 30}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}