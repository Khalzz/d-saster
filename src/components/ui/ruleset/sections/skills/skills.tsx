import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SectionHeader } from "../section-header";
import { FormulaInput } from "../../../input/formula-input";
import type { Ruleset, RulesetSkill } from "../../../../../pages/ruleset/ruleset-editor";
import { SkillCard } from "./skill-card";
import { SkillModal } from "./skill-modal";
import { SectionBody } from "../section-body";

export function SkillsSection({ ruleset, setRuleset }: {
  ruleset: Ruleset;
  setRuleset: Dispatch<SetStateAction<Ruleset>>;
}) {
  const [skillModal, setSkillModal] = useState<{ skill: RulesetSkill; isNew: boolean } | null>(null);

  const openNewSkill = () => setSkillModal({
    isNew: true,
    skill: { id: crypto.randomUUID(), name: "", statKey: ruleset.stats[0]?.key ?? "", description: "" },
  });

  const saveSkill = (skill: RulesetSkill) => {
    setRuleset(prev => {
      const exists = prev.skills.some(s => s.id === skill.id);
      const updated = { ...prev, skills: exists ? prev.skills.map(s => s.id === skill.id ? skill : s) : [...prev.skills, skill] };
      invoke("save_ruleset", { ruleset: updated }).catch(() => {});
      return updated;
    });
    setSkillModal(null);
  };

  const removeSkill = (id: string) =>
    setRuleset(r => ({ ...r, skills: r.skills.filter(s => s.id !== id) }));

  return (<>
    <SectionHeader title="Skills" action={
      <button className="h-7! text-[11px]! px-2.5! gap-1.5! border-gold-500/30! text-gold-500! shrink-0" onClick={openNewSkill}>
        <Plus className="h-3 w-3" /> Add Skill
      </button>
    } />
    <SectionBody>
      <FormulaInput label="Skill formula" value={ruleset.skillFormula} onChange={v => setRuleset(r => ({ ...r, skillFormula: v }))} placeholder="{{stat_mod}} + {{proficiency_bonus}}" />
      <div className="flex flex-col gap-3">
        {ruleset.skills.length === 0 && <p className="text-gold-700 text-xs">No skills defined yet.</p>}
        {ruleset.skills.slice().sort((a, b) => a.name.localeCompare(b.name)).map(skill => (
          <SkillCard
            key={skill.id}
            skill={skill}
            stats={ruleset.stats}
            onEdit={() => setSkillModal({ skill: { ...skill }, isNew: false })}
            onDelete={() => removeSkill(skill.id)}
          />
        ))}
      </div>
    </SectionBody>
    {skillModal && (
      <SkillModal
        skill={skillModal.skill}
        isNew={skillModal.isNew}
        stats={ruleset.stats}
        onSave={saveSkill}
        onClose={() => setSkillModal(null)}
      />
    )}
  </>);
}
