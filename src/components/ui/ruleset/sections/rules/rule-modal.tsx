import { useState } from "react";
import { EditorModal } from "../editor-modal";
import Field from "../../../Field";
import { Dropdown, type DropdownOption } from "../../../Dropdown";
import type { RulesetRule } from "../../../../../pages/ruleset/ruleset-editor";

export function RuleModal({ rule: initial, isNew, categories, onAddCategory, onSave, onClose }: {
  rule: RulesetRule;
  isNew: boolean;
  categories: string[];
  onAddCategory: (name: string) => void;
  onSave: (rule: RulesetRule) => void;
  onClose: () => void;
}) {
  const [rule, setRule] = useState<RulesetRule>(initial);

  const catOptions: DropdownOption[] = [
    { value: "", label: "No category" },
    ...categories.map(c => ({ value: c, label: c })),
  ];

  return (
    <EditorModal title={isNew ? "New Rule" : "Edit Rule"} saveLabel={isNew ? "Add Rule" : "Save"} onSave={() => onSave(rule)} onClose={onClose}>
      <div className="flex gap-3">
        <Field label="Name" className="flex-1">
          <input value={rule.name} onChange={e => setRule(r => ({ ...r, name: e.target.value }))} placeholder="Rule name…" autoFocus />
        </Field>
        <Field label="Category" className="w-44">
          <Dropdown
            options={catOptions}
            value={rule.category ?? ""}
            onChange={v => setRule(r => ({ ...r, category: v || undefined }))}
            placeholder="No category"
            onAddNew={name => { onAddCategory(name); setRule(r => ({ ...r, category: name })); }}
            addNewPlaceholder="Category name…"
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea rows={10} value={rule.description} onChange={e => setRule(r => ({ ...r, description: e.target.value }))} placeholder="Describe this rule… (markdown supported)" />
      </Field>
    </EditorModal>
  );
}
