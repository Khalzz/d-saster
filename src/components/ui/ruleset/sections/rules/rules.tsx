import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SectionHeader } from "../section-header";
import type { Ruleset, RulesetRule } from "../../../../../pages/ruleset/ruleset-editor";
import { RuleCard } from "./rule-card";
import { RuleModal } from "./rule-modal";

export function RulesSection({ ruleset, setRuleset }: {
  ruleset: Ruleset;
  setRuleset: Dispatch<SetStateAction<Ruleset>>;
}) {
  const [ruleModal, setRuleModal] = useState<{ rule: RulesetRule; isNew: boolean } | null>(null);

  const openNewRule = () => setRuleModal({
    isNew: true,
    rule: { id: crypto.randomUUID(), name: "", description: "" },
  });

  const addRuleCategory = (name: string) =>
    setRuleset(r => r.ruleCategories.includes(name) ? r : { ...r, ruleCategories: [...r.ruleCategories, name] });

  const saveRule = (rule: RulesetRule) => {
    setRuleset(prev => {
      const exists = prev.rules.some(r => r.id === rule.id);
      const updated = { ...prev, rules: exists ? prev.rules.map(r => r.id === rule.id ? rule : r) : [...prev.rules, rule] };
      invoke("save_ruleset", { ruleset: updated }).catch(() => {});
      return updated;
    });
    setRuleModal(null);
  };

  const removeRule = (id: string) =>
    setRuleset(r => ({ ...r, rules: r.rules.filter(rule => rule.id !== id) }));

  return (<>
    <SectionHeader title="Rules" action={
      <button className="h-7! text-[11px]! px-2.5! gap-1.5! border-gold-500/30! text-gold-500! shrink-0" onClick={openNewRule}>
        <Plus className="h-3 w-3" /> Add Rule
      </button>
    } />
    {ruleset.rules.length === 0
      ? <p className="text-gold-700 text-xs px-4">No rules defined yet.</p>
      : <div className="flex flex-col gap-5 px-4 pb-4">
          {(() => {
            const uncategorized = ruleset.rules.filter(r => !r.category || !ruleset.ruleCategories.includes(r.category));
            if (uncategorized.length === 0) return null;
            return (
              <div className="flex flex-col gap-2">
                {uncategorized.map(rule => (
                  <RuleCard key={rule.id} rule={rule}
                    onEdit={() => setRuleModal({ rule: { ...rule }, isNew: false })}
                    onDelete={() => removeRule(rule.id)}
                  />
                ))}
              </div>
            );
          })()}
          {ruleset.ruleCategories.map(cat => {
            const catRules = ruleset.rules.filter(r => r.category === cat);
            if (catRules.length === 0) return null;
            return (
              <div key={cat} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-gold-500 text-lg font-semibold shrink-0">{cat}</span>
                  <div className="flex-1 h-px bg-gold-500/15" />
                </div>
                {catRules.map(rule => (
                  <RuleCard key={rule.id} rule={rule}
                    onEdit={() => setRuleModal({ rule: { ...rule }, isNew: false })}
                    onDelete={() => removeRule(rule.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
    }
    {ruleModal && (
      <RuleModal
        rule={ruleModal.rule}
        isNew={ruleModal.isNew}
        categories={ruleset.ruleCategories}
        onAddCategory={addRuleCategory}
        onSave={saveRule}
        onClose={() => setRuleModal(null)}
      />
    )}
  </>);
}
