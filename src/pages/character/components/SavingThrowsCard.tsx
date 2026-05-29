import Card from "../../../components/ui/card/card";
import { SavingThrowRow } from "./SavingThrowRow";
import { calcSkill } from "./SkillCell";
import type { StatDefinition } from "../../ruleset/ruleset-editor";

interface Props {
  statDefs: StatDefinition[];
  stats: Record<string, number>;
  savingThrowFormula?: string;
  modifierFormula?: string;
  proficiencyBonus: number;
  level: number;
}

export function SavingThrowsCard({ statDefs, stats, savingThrowFormula, modifierFormula, proficiencyBonus, level }: Props) {
  return (
    <Card className="h-fit flex flex-col gap-1.5 bg-transparent" title="Saving Throws">
      <div className="grid grid-cols-3 gap-1.5">
        {statDefs.map(def => {
          const formula = savingThrowFormula || "{{stat_mod}}";
          const value = calcSkill(formula, stats[def.key] ?? 10, modifierFormula, proficiencyBonus, level);
          return (
            <SavingThrowRow
              key={def.key}
              label={def.label}
              value={value}
            />
          );
        })}
      </div>
    </Card>
  );
}
