import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { EditorModal } from "../editor-modal";
import Field from "../../../Field";
import type { RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";
import { traitFieldKey } from "../../../../../pages/ruleset/ruleset-editor";
import { HandlebarTextarea } from "../../../../../pages/sheet-editor/components/nodes/HandlebarInput";
import type { VarDef } from "../../../../../pages/sheet-editor/types";

export function TraitModal({ trait: initial, isNew, onSave, onClose }: {
  trait: RulesetSpecieTrait;
  isNew: boolean;
  onSave: (trait: RulesetSpecieTrait) => void;
  onClose: () => void;
}) {
  const [trait, setTrait] = useState<RulesetSpecieTrait>({ ...initial, fields: initial.fields ?? [] });

  const addField = () =>
    setTrait(t => ({ ...t, fields: [...t.fields, { id: crypto.randomUUID(), label: "" }] }));

  const removeField = (id: string) =>
    setTrait(t => ({ ...t, fields: t.fields.filter(f => f.id !== id) }));

  const inputCls = "bg-base border border-gold-500/20 rounded-md px-2.5 h-8 text-xs text-gold-400 outline-none focus:border-gold-500/40 caret-gold-500";

  const fieldVars: VarDef[] = trait.fields
    .map(f => ({ key: traitFieldKey(f.label), description: f.label }))
    .filter(v => v.key);

  return (
    <EditorModal title={isNew ? "New Trait" : "Edit Trait"} saveLabel={isNew ? "Add Trait" : "Save"} onSave={() => onSave(trait)} onClose={onClose}>
      <Field label="Name">
        <input value={trait.name} onChange={e => setTrait(t => ({ ...t, name: e.target.value }))} placeholder="Trait name…" autoFocus />
      </Field>
      <Field label="Description">
        <HandlebarTextarea
          value={trait.description}
          onChange={desc => setTrait(t => ({ ...t, description: desc }))}
          placeholder={"Describe this trait… Type {{ to insert a field variable."}
          rows={5}
          extraVars={fieldVars}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-gold-500 text-xs font-semibold">Configurable fields</span>
          <button type="button" className="h-6! text-[11px]! px-2! gap-1! border-gold-500/30! text-gold-500!" onClick={addField}>
            <Plus className="h-3 w-3" /> Add field
          </button>
        </div>
        {trait.fields.length === 0
          ? <p className="text-gold-700 text-[11px]">No fields — add fields whose values can be set per specie (e.g. Distance, Radius).</p>
          : <div className="flex flex-col gap-1.5">
              {trait.fields.map(field => {
                const key = traitFieldKey(field.label);
                return (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      className={inputCls + " flex-1"}
                      value={field.label}
                      placeholder="Field name (e.g. Distance)"
                      onChange={e => setTrait(t => ({ ...t, fields: t.fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f) }))}
                    />
                    {key && (
                      <code className="shrink-0 text-[10px] font-mono text-gold-600 bg-gold-500/10 border border-gold-500/20 rounded px-1.5 py-1 select-all">
                        {`{{${key}}}`}
                      </code>
                    )}
                    <button
                      type="button"
                      className="w-7! h-7! min-w-0! p-0! shrink-0 bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]!"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
        }
      </div>
    </EditorModal>
  );
}
