import Card from "../../../components/ui/card/card";
import { StatCell } from "./StatCell";
import type { StatDefinition } from "../../ruleset/ruleset-editor";

interface Props {
  statDefs: StatDefinition[];
  stats: Record<string, number>;
  modifierFormula?: string;
  onChange: (key: string, raw: string) => void;
}

export function StatsCard({ statDefs, stats, modifierFormula, onChange }: Props) {
  return (
    <Card className="h-fit bg-transparent" title="Stats">
      {statDefs.length === 0 ? (
        <p className="text-gold-700 text-xs">No stats defined in the selected ruleset.</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {statDefs.map(def => (
            <StatCell
              key={def.key}
              def={def}
              val={stats[def.key] ?? 10}
              formula={modifierFormula}
              onChange={(raw) => onChange(def.key, raw)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
