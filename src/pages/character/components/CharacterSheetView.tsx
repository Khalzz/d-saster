import { AutoSavingThrowsNode } from "../../../components/ui/character-sheet/nodes/auto-saving-throw/auto-saving-throw";
import { ProficiencyBonusNode } from "../../../components/ui/character-sheet/nodes/proficiency-node/proficiency-node";
import { ContainerNode } from "../../../components/ui/character-sheet/containers/container-node/container-node";
import { ClassSelectorNode } from "../../../components/ui/character-sheet/nodes/class-selector/class-selector";
import { TextInputNode } from "../../../components/ui/character-sheet/nodes/text-input-node/text-input-node";
import { SectionNode } from "../../../components/ui/character-sheet/containers/section-node/section-node";
import { AutoSkillsNode } from "../../../components/ui/character-sheet/nodes/auto-skills/auto-skills";
import { AutoStatsNode } from "../../../components/ui/character-sheet/nodes/auto-stats/auto-stats";
import { StaticCounterNode } from "../../../components/ui/character-sheet/nodes/static-counter/static-counter";
import { FeaturesAndTraitsNode } from "../../../components/ui/character-sheet/nodes/features-and-traits/features-and-traits";
import { SpecieNode } from "../../../components/ui/character-sheet/nodes/specie-node/specie-node";
import { CountNode } from "../../../components/ui/character-sheet/nodes/count-node/count-node";
import { ImageNode } from "../../../components/ui/character-sheet/nodes/image-node/image-node";
import type { Ruleset, StatDefinition, RulesetSkill } from "../../ruleset/ruleset-editor";
import { createContext, useContext, useEffect, useState } from "react";
import type { Character, CharacterClass } from "../character-editor";
import type { LayoutNode } from "../../sheet-editor/types";
import { invoke } from "@tauri-apps/api/core";
import { calcModifier } from "./StatCell";
import { labelToVar } from "../../sheet-editor/handlebars";

export interface SheetContext {
  char: Character;
  onChange: (patch: Partial<Character>) => void;
  ruleset?: Ruleset;
  statDefs: StatDefinition[];
  skills: RulesetSkill[];
  classes: CharacterClass[];
  onClassCreated?: (cls: CharacterClass) => void;
  vars: Record<string, string | number>;
}

const SheetCtx = createContext<SheetContext>(null!);
function useSheet() { return useContext(SheetCtx); }

const TreeCtx = createContext<LayoutNode[]>([]);
function useTree() { return useContext(TreeCtx); }

export function InteractiveNode({ node }: { node: LayoutNode }) {
  switch (node.type) {
    case "section": return <SectionNode node={node} useSheet={useSheet} />;
    case "container": return <ContainerNode node={node} />;
    case "image": return <ImageNode node={node} useSheet={useSheet} />;
    case "text-input": return <TextInputNode node={node} useSheet={useSheet} />;
    // case "level-count": return <LevelCountNode node={node} />;
    case "counter": return <CountNode node={node} useSheet={useSheet} />;
    case "class-selector": return <ClassSelectorNode node={node} useSheet={useSheet} />;
    // case "grid": return <GridNode node={node} />;
    case "auto-stats": return <AutoStatsNode node={node} useSheet={useSheet} />;
    case "auto-skills": return <AutoSkillsNode node={node} useSheet={useSheet} />;
    case "auto-saving-throws": return <AutoSavingThrowsNode node={node} useSheet={useSheet} useTree={useTree} />;
    case "proficiency-bonus": return <ProficiencyBonusNode node={node} useSheet={useSheet} />;
    case "static-counter": return <StaticCounterNode node={node} useSheet={useSheet} />;
    case "specie": return <SpecieNode node={node} useSheet={useSheet} />;
    case "features-and-traits": return <FeaturesAndTraitsNode node={node} useSheet={useSheet} />;
    default: return null;
  }
}

interface CharacterSheetViewProps {
  char: Character;
  onChange: (patch: Partial<Character>) => void;
  ruleset?: Ruleset;
  statDefs: StatDefinition[];
  skills: RulesetSkill[];
  classes: CharacterClass[];
  onClassCreated?: (cls: CharacterClass) => void;
}

export function CharacterSheetView({ char, onChange, ruleset, statDefs, skills, classes, onClassCreated }: CharacterSheetViewProps) {
  const [nodes, setNodes] = useState<LayoutNode[]>([]);

  useEffect(() => {
    invoke<{ nodes: LayoutNode[] } | null>("load_sheet", { id: "default" })
      .then((data) => { if (data?.nodes) setNodes(data.nodes); })
      .catch(() => {});
  }, []);

  const vars: Record<string, string | number> = {
    level: char.level,
    proficiency_bonus: char.proficiencyBonus,
    inspiration: char.inspiration,
    armor_class: char.armorClass,
    speed: char.speed,
    initiative: char.initiative,
    name: char.name,
    race: char.race,
    origin: char.origin,
    description: char.description,
    ...Object.fromEntries(
      Object.entries(char.stats ?? {}).flatMap(([k, v]) => {
        const mod = parseInt(calcModifier(v, ruleset?.modifierFormula)) || 0;
        const modSigned = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : "";
        return [
          [`stat.${k}.points`, v],
          [`stat.${k}.mod`, modSigned],
        ];
      })
    ),
    ...(() => {
      const specie = ruleset?.species?.find(s => s.id === char.race);
      if (!specie) return {};
      return {
        "specie.name": specie.name,
        "specie.size": specie.size.join(", "),
        "specie.unit": specie.unit,
        ...Object.fromEntries(specie.movements.map(m => [`specie.movement.${labelToVar(m.label)}`, m.value])),
        ...Object.fromEntries(specie.senses.map(s => [`specie.sense.${labelToVar(s.label)}`, s.value])),
        ...Object.fromEntries(Object.entries(specie.statModifiers).map(([k, v]) => [`specie.stat.${k}`, v])),
      };
    })(),
    ...char.customFields,
  };

  const ctx: SheetContext = { char, onChange, ruleset, statDefs, skills, classes, onClassCreated, vars };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gold-700 text-xs">
        No sheet layout configured
      </div>
    );
  }

  return (
    <SheetCtx.Provider value={ctx}>
      <TreeCtx.Provider value={nodes}>
        <div className="flex flex-col gap-4 p-6">
          {nodes.map((node) => (
            <InteractiveNode key={node.id} node={node} />
          ))}
        </div>
      </TreeCtx.Provider>
    </SheetCtx.Provider>
  );
}