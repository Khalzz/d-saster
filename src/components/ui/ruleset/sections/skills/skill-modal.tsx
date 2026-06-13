import { useState } from "react";
import type { RulesetSkill, StatDefinition } from "../../../../../pages/ruleset/ruleset-editor";
import { EditorModal } from "../editor-modal";
import Field from "../../../Field";
import { Dropdown } from "../../../Dropdown";

export function SkillModal({ skill: initial, isNew, stats, onSave, onClose }: {
  skill: RulesetSkill;
  isNew: boolean;
  stats: StatDefinition[];
  onSave: (skill: RulesetSkill) => void;
  onClose: () => void;
}) {
  const [skill, setSkill] = useState(initial);

  return (
    <EditorModal title={isNew ? "New Skill" : "Edit Skill"} saveLabel={isNew ? "Add Skill" : "Save"} onSave={() => onSave(skill)} onClose={onClose}>
      <Field label="Name">
        <input value={skill.name} onChange={e => setSkill(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Athletics" autoFocus />
      </Field>
      <Field label="Linked Stat">
        <Dropdown
          value={skill.statKey || null}
          options={stats.map(s => ({ value: s.key, label: s.label }))}
          onChange={v => setSkill(s => ({ ...s, statKey: v }))}
          placeholder="Select stat…"
        />
      </Field>
      <Field label="Description">
        <textarea rows={4} value={skill.description} onChange={e => setSkill(s => ({ ...s, description: e.target.value }))} placeholder="Describe this skill… (markdown supported)" />
      </Field>
    </EditorModal>
  );
}
