import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SectionHeader } from "../section-header";
import { FormulaInput } from "../../../input/formula-input";
import type { Ruleset, StatDefinition } from "../../../../../pages/ruleset/ruleset-editor";
import { StatCard } from "./stat-card";
import { StatModal } from "./stats-modal";
import { SectionBody } from "../section-body";

export function StatsSection({ ruleset, setRuleset }: {
  ruleset: Ruleset;
  setRuleset: Dispatch<SetStateAction<Ruleset>>;
}) {
  const [statModal, setStatModal] = useState<{ stat: StatDefinition; isNew: boolean } | null>(null);

  const openNewStat = () => setStatModal({
    isNew: true,
    stat: { id: crypto.randomUUID(), key: "", label: "", description: "" },
  });

  const saveStat = (stat: StatDefinition) => {
    setRuleset(prev => {
      const exists = stat.id ? prev.stats.some(s => s.id === stat.id) : prev.stats.some(s => s.key === stat.key);
      const match = (s: StatDefinition) => stat.id ? s.id === stat.id : s.key === stat.key;
      const updated = { ...prev, stats: exists ? prev.stats.map(s => match(s) ? stat : s) : [...prev.stats, stat] };
      invoke("save_ruleset", { ruleset: updated }).catch(() => {});
      return updated;
    });
    setStatModal(null);
  };

  const removeStat = (id: string) =>
    setRuleset(r => ({ ...r, stats: r.stats.filter(s => s.id !== id) }));

  return (<>
    <SectionHeader title="Stats" action={
      <button className="h-7! text-[11px]! px-2.5! gap-1.5! border-gold-500/30! text-gold-500! shrink-0" onClick={openNewStat}>
        <Plus className="h-3 w-3" /> Add Stat
      </button>
    } />
    <SectionBody>
      <FormulaInput label="Modifier formula" value={ruleset.modifierFormula} onChange={v => setRuleset(r => ({ ...r, modifierFormula: v }))} placeholder="({{stat_points}} - 10) / 2" />
      <div className="flex flex-col gap-3">
        {ruleset.stats.length === 0 && <p className="text-gold-700 text-xs">No stats defined yet.</p>}
        {ruleset.stats.map(stat => (
          <StatCard
            key={stat.id}
            stat={stat}
            onEdit={() => setStatModal({ stat, isNew: false })}
            onDelete={() => removeStat(stat.id!)}
          />
        ))}
      </div>
    </SectionBody>
    {statModal && (
      <StatModal
        stat={statModal.stat}
        isNew={statModal.isNew}
        onSave={saveStat}
        onClose={() => setStatModal(null)}
      />
    )}
  </>);
}
