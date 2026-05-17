import Card from "../../../components/ui/card/card";
import { SavingThrowRow } from "./SavingThrowRow";
import type { StatDefinition } from "../../ruleset/ruleset-editor";

interface Props {
  statDefs: StatDefinition[];
  savingThrows: Record<string, number>;
  onChange: (key: string, val: number) => void;
}

export function SavingThrowsCard({ statDefs, savingThrows, onChange }: Props) {
  return (
    <Card className="h-fit flex flex-col gap-1.5 bg-transparent" title="Saving Throws">
      <div className="grid grid-cols-3 gap-1.5">
        {statDefs.map(def => (
          <SavingThrowRow
            key={def.key}
            label={def.label}
            value={savingThrows[def.key] ?? 0}
            onChange={(v) => onChange(def.key, v)}
          />
        ))}
      </div>
    </Card>
  );
}
