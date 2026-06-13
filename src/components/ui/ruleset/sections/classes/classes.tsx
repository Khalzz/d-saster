import type { Dispatch, SetStateAction } from "react";
import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { SectionHeader } from "../section-header";
import type { Ruleset, RulesetClass, RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";
import { ClassCard } from "./class-card";
import { ClassInlineEditor } from "./class-modal";
import type { ClassInlineEditorHandle } from "./class-modal";
import { SectionBody } from "../section-body";

export function ClassesSection({ ruleset, setRuleset }: {
  ruleset: Ruleset;
  setRuleset: Dispatch<SetStateAction<Ruleset>>;
}) {
  const [editing, setEditing] = useState<{ cls: RulesetClass; isNew: boolean } | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editorRef = useRef<ClassInlineEditorHandle>(null);

  const openNew = () => {
    const cls: RulesetClass = {
      id: crypto.randomUUID(), name: "", description: "", modifiers: [],
      primaryAbility: "", hitDie: "", savingThrowProficiencies: [],
      skillProficiencies: { count: 2, options: [] }, levelFeatures: [],
    };
    setEditing({ cls, isNew: true });
    setEditingName("");
  };

  const openEdit = (cls: RulesetClass) => {
    setEditing({ cls: { ...cls }, isNew: false });
    setEditingName(cls.name);
  };

  const saveClass = (cls: RulesetClass) => {
    setRuleset(prev => {
      const exists = prev.classes.some(c => c.id === cls.id);
      const updated = { ...prev, classes: exists ? prev.classes.map(c => c.id === cls.id ? cls : c) : [...prev.classes, cls] };
      invoke("save_ruleset", { ruleset: updated }).catch(() => {});
      return updated;
    });
    setEditing(null);
  };

  const deleteClass = (id: string) => {
    setRuleset(r => {
      const updated = { ...r, classes: r.classes.filter(c => c.id !== id) };
      invoke("save_ruleset", { ruleset: updated }).catch(() => {});
      return updated;
    });
    setEditing(null);
    setConfirmDelete(false);
  };

  const onCreateTrait = (trait: RulesetSpecieTrait) =>
    setRuleset(r => ({ ...r, traits: [...r.traits, trait] }));

  const onUpdateTrait = (trait: RulesetSpecieTrait) =>
    setRuleset(r => ({ ...r, traits: r.traits.map(t => t.id === trait.id ? trait : t) }));

  const title = editing ? (
    <>
      <button
        className="bg-transparent! border-0! h-auto! p-0! text-gold-600! font-bold! text-lg! hover:text-gold-400! transition-colors!"
        onClick={() => setEditing(null)}
      >
        Classes
      </button>
      <span className="text-gold-700 mx-1.5 font-normal">/</span>
      <span>{editingName || "New Class"}</span>
    </>
  ) : "Classes";

  const action = editing ? (
    <div className="flex gap-2">
      {!editing.isNew && (
        <button
          className="h-7! text-[11px]! px-2.5! border-red-500/30! text-red-400! hover:bg-red-500/10! hover:border-red-500/50! shrink-0"
          onClick={() => setConfirmDelete(true)}
        >
          Delete Class
        </button>
      )}
      <button
        className="h-7! text-[11px]! px-2.5! gap-1.5! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400! shrink-0"
        onClick={() => { const cls = editorRef.current?.getCurrentCls(); if (cls) saveClass(cls); }}
      >
        {editing.isNew ? "Add Class" : "Save Changes"}
      </button>
    </div>
  ) : (
    <button
      className="h-7! text-[11px]! px-2.5! gap-1.5! border-gold-500/30! text-gold-500! shrink-0"
      onClick={openNew}
    >
      <Plus className="h-3 w-3" /> Add Class
    </button>
  );

  return (
    <>
      <SectionHeader title={title} action={action} />
      <SectionBody>
        {editing ? (
          <ClassInlineEditor
            ref={editorRef}
            cls={editing.cls}
            isNew={editing.isNew}
            stats={ruleset.stats}
            skills={ruleset.skills}
            traits={ruleset.traits}
            onCreateTrait={onCreateTrait}
            onUpdateTrait={onUpdateTrait}
            onNameChange={setEditingName}
          />
        ) : (
          ruleset.classes.length === 0
            ? <p className="text-gold-700 text-xs px-4">No classes defined yet.</p>
            : <div className="flex flex-col gap-3 py-4">
                {ruleset.classes.slice().sort((a, b) => a.name.localeCompare(b.name)).map(cls => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    stats={ruleset.stats}
                    skills={ruleset.skills}
                    onEdit={() => openEdit(cls)}
                    onDelete={() => deleteClass(cls.id)}
                  />
                ))}
              </div>
        )}
      </SectionBody>

      {confirmDelete && editing && createPortal(
        <>
          <div className="fixed inset-0 z-200 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="fixed inset-0 z-201 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-surface border border-gold-500/20 rounded-xl p-6 max-w-sm w-full pointer-events-auto shadow-2xl flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-gold-300 font-semibold text-sm">Delete Class</h3>
                <p className="text-gold-600 text-xs">
                  Are you sure you want to delete <span className="text-gold-400 font-medium">"{editingName || "this class"}"</span>? This cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4! h-8! text-xs! border-gold-500/30! text-gold-500!"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4! h-8! text-xs! border-red-500/30! text-red-400! hover:bg-red-500/10! hover:border-red-500/50!"
                  onClick={() => deleteClass(editing.cls.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
