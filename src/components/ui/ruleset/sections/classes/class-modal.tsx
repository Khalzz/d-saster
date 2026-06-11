import { useState } from "react";
import { EditorModal } from "../editor-modal";
import Field from "../../../Field";
import type { RulesetClass } from "../../../../../pages/ruleset/ruleset-editor";

export function ClassModal({ cls: initial, isNew, onSave, onClose }: {
  cls: RulesetClass;
  isNew: boolean;
  onSave: (cls: RulesetClass) => void;
  onClose: () => void;
}) {
  const [cls, setCls] = useState<RulesetClass>(initial);
  return (
    <EditorModal title={isNew ? "New Class" : "Edit Class"} saveLabel={isNew ? "Add Class" : "Save"} onSave={() => onSave(cls)} onClose={onClose}>
      <Field label="Name">
        <input value={cls.name} onChange={e => setCls(c => ({ ...c, name: e.target.value }))} placeholder="Class name…" autoFocus />
      </Field>
      <Field label="Description">
        <textarea rows={4} value={cls.description} onChange={e => setCls(c => ({ ...c, description: e.target.value }))} placeholder="Describe this class… (markdown supported)" />
      </Field>
    </EditorModal>
  );
}
