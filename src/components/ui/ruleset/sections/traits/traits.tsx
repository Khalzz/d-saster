import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SectionHeader } from "../section-header";
import type { Ruleset, RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";
import { TraitCard } from "./trait-card";
import { TraitModal } from "./trait-modal";
import { SectionBody } from "../section-body";

export function TraitsSection({ ruleset, setRuleset }: {
  ruleset: Ruleset;
  setRuleset: Dispatch<SetStateAction<Ruleset>>;
}) {
  const [traitModal, setTraitModal] = useState<{ trait: RulesetSpecieTrait; isNew: boolean } | null>(null);

  const openNewTrait = () => setTraitModal({
    isNew: true,
    trait: { id: crypto.randomUUID(), name: "", description: "", fields: [] },
  });

  const saveTrait = (trait: RulesetSpecieTrait) => {
    const exists = ruleset.traits.some(t => t.id === trait.id);
    const updated = { ...ruleset, traits: exists ? ruleset.traits.map(t => t.id === trait.id ? trait : t) : [...ruleset.traits, trait] };
    setRuleset(updated);
    invoke("save_ruleset", { ruleset: updated }).catch(() => {});
    setTraitModal(null);
  };

  const removeTrait = (id: string) =>
    setRuleset(r => ({ ...r, traits: r.traits.filter(t => t.id !== id) }));

  return (<>
    <SectionHeader title="Traits" action={
      <button className="h-7! text-[11px]! px-2.5! gap-1.5! border-gold-500/30! text-gold-500! shrink-0" onClick={openNewTrait}>
        <Plus className="h-3 w-3" /> Add Trait
      </button>
    } />
    <SectionBody>
      {ruleset.traits.length === 0
        ? <p className="text-gold-700 text-xs px-4">No traits defined yet.</p>
        : <div className="flex flex-col gap-3 px-4 pb-4">
            {ruleset.traits.map(trait => (
              <TraitCard
                key={trait.id}
                trait={trait}
                onEdit={() => setTraitModal({ trait: { ...trait }, isNew: false })}
                onDelete={() => removeTrait(trait.id)}
              />
            ))}
          </div>
      }
    </SectionBody>
    {traitModal && (
      <TraitModal
        trait={traitModal.trait}
        isNew={traitModal.isNew}
        onSave={saveTrait}
        onClose={() => setTraitModal(null)}
      />
    )}
  </>);
}
