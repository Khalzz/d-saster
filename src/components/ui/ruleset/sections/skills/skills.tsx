import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { SectionHeader } from "../section-header";
import { FormulaInput } from "../../../input/formula-input";
import type { Ruleset, RulesetSkill } from "../../../../../pages/ruleset/ruleset-editor";
import { SkillCard } from "./skill-card";
import { SectionBody } from "../section-body";

export function SkillsSection({ ruleset, setRuleset }: {
  ruleset: Ruleset;
  setRuleset: Dispatch<SetStateAction<Ruleset>>;
}) {
  const [lastAddedSkillId, setLastAddedSkillId] = useState<string | null>(null);

  const addSkill = () => {
    const id = crypto.randomUUID();
    setLastAddedSkillId(id);
    setRuleset(r => ({ ...r, skills: [...r.skills, { id, name: "", statKey: r.stats[0]?.key ?? "", description: "" }] }));
  };

  const updateSkill = (i: number, patch: Partial<RulesetSkill>) =>
    setRuleset(r => ({ ...r, skills: r.skills.map((s, j) => j === i ? { ...s, ...patch } : s) }));

  const removeSkill = (i: number) =>
    setRuleset(r => ({ ...r, skills: r.skills.filter((_, j) => j !== i) }));

  const duplicateSkill = (i: number) => {
    const id = crypto.randomUUID();
    setLastAddedSkillId(id);
    setRuleset(r => {
      const skills = [...r.skills];
      skills.splice(i + 1, 0, { ...skills[i], id });
      return { ...r, skills };
    });
  };

  return (<>
    <SectionHeader title="Skills" action={
      <button className="h-7! text-[11px]! px-2.5! gap-1.5! border-gold-500/30! text-gold-500! shrink-0" onClick={addSkill}>
        <Plus className="h-3 w-3" /> Add Skill
      </button>
    } />
    <SectionBody>
      <FormulaInput label="Skill formula" value={ruleset.skillFormula} onChange={v => setRuleset(r => ({ ...r, skillFormula: v }))} placeholder="{{stat_mod}} + {{proficiency_bonus}}" />
      <div className="border border-gold-500/20 rounded-lg overflow-hidden">
        {ruleset.skills.length === 0
          ? <p className="text-gold-700 text-xs px-3 py-3">No skills defined yet.</p>
          : <div className="p-2 space-y-2">
              {ruleset.skills.map((skill, i) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  stats={ruleset.stats}
                  onUpdate={p => updateSkill(i, p)}
                  onDelete={() => removeSkill(i)}
                  onDuplicate={() => duplicateSkill(i)}
                  focusOnMount={skill.id === lastAddedSkillId}
                />
              ))}
            </div>
        }
      </div>
    </SectionBody>
  </>);
}
