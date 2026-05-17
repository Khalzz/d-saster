import Card from "../../../components/ui/card/card";
import { SkillCell } from "./SkillCell";
import type { Ruleset, StatDefinition } from "../../ruleset/ruleset-editor";

interface Props {
  ruleset: Ruleset;
  statDefs: StatDefinition[];
  stats: Record<string, number>;
}

export function SkillsCard({ ruleset, statDefs, stats }: Props) {
  if (ruleset.skills.length === 0) return null;

  return (
    <Card className="w-fit bg-transparent" title="Skills">
      <div className="grid grid-cols-2 gap-1.5">
        {ruleset.skills.map(skill => {
          const statDef = statDefs.find(d => d.key === skill.statKey);
          return (
            <SkillCell
              key={skill.id}
              skill={skill}
              statLabel={statDef?.label ?? skill.statKey}
              statPoints={stats[skill.statKey] ?? 10}
              skillFormula={ruleset.skillFormula}
              modifierFormula={ruleset.modifierFormula}
            />
          );
        })}
      </div>
    </Card>
  );
}
