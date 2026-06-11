import { useState } from "react";
import { StatDefinition } from "../../../../../pages/ruleset/ruleset-editor";
import { EditorModal } from "../editor-modal";
import Field from "../../../Field";

export function StatModal({ stat: initial, isNew, onSave, onClose }: {
  stat: StatDefinition;
  isNew: boolean;
  onSave: (stat: StatDefinition) => void;
  onClose: () => void;
}) {
  const [stat, setStat] = useState(initial);

  const setLabel = (label: string) =>
    setStat(s => ({ ...s, label, key: label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") }));

  return (
    <EditorModal title={isNew ? "New Stat" : "Edit Stat"} saveLabel={isNew ? "Add Stat" : "Save"} onSave={() => onSave(stat)} onClose={onClose}>
      <Field label="Name">
        <input value={stat.label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Strength" autoFocus />
      </Field>
      <Field label="Description">
        <textarea rows={4} value={stat.description} onChange={e => setStat(s => ({ ...s, description: e.target.value }))} placeholder="Describe this stat… (markdown supported)" />
      </Field>
    </EditorModal>
  );
}
