import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SectionHeader } from "../section-header";
import type { Ruleset, RulesetClass } from "../../../../../pages/ruleset/ruleset-editor";
import { ClassCard } from "./class-card";
import { ClassModal } from "./class-modal";
import { SectionBody } from "../section-body";

export function ClassesSection({ ruleset, setRuleset }: {
  ruleset: Ruleset;
  setRuleset: Dispatch<SetStateAction<Ruleset>>;
}) {
  const [classModal, setClassModal] = useState<{ cls: RulesetClass; isNew: boolean } | null>(null);

  const openNewClass = () => setClassModal({
    isNew: true,
    cls: { id: crypto.randomUUID(), name: "", description: "", modifiers: [] },
  });

  const saveClass = (cls: RulesetClass) => {
    setRuleset(prev => {
      const exists = prev.classes.some(c => c.id === cls.id);
      const updated = { ...prev, classes: exists ? prev.classes.map(c => c.id === cls.id ? cls : c) : [...prev.classes, cls] };
      invoke("save_ruleset", { ruleset: updated }).catch(() => {});
      return updated;
    });
    setClassModal(null);
  };

  const removeClass = (id: string) =>
    setRuleset(r => ({ ...r, classes: r.classes.filter(c => c.id !== id) }));

  return (<>
    <SectionHeader title="Classes" action={
      <button className="h-7! text-[11px]! px-2.5! gap-1.5! border-gold-500/30! text-gold-500! shrink-0" onClick={openNewClass}>
        <Plus className="h-3 w-3" /> Add Class
      </button>
    } />
    <SectionBody>
      {ruleset.classes.length === 0
        ? <p className="text-gold-700 text-xs px-4">No classes defined yet.</p>
        : <div className="flex flex-col gap-3 px-4 pb-4">
            {ruleset.classes.map(cls => (
              <ClassCard
                key={cls.id}
                cls={cls}
                onEdit={() => setClassModal({ cls: { ...cls }, isNew: false })}
                onDelete={() => removeClass(cls.id)}
              />
            ))}
          </div>
      }
    </SectionBody>

    {classModal && (
      <ClassModal
        cls={classModal.cls}
        isNew={classModal.isNew}
        onSave={saveClass}
        onClose={() => setClassModal(null)}
      />
    )}
  </>);
}
