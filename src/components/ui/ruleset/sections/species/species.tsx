import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SectionHeader } from "../section-header";
import type { Ruleset, RulesetSpecie, RulesetSpecieTrait } from "../../../../../pages/ruleset/ruleset-editor";
import { SpecieCard } from "./specie-card";
import { SpecieModal } from "./specie-modal";
import { SectionBody } from "../section-body";

export default function SpeciesSection({ ruleset, setRuleset }: {
  ruleset: Ruleset;
  setRuleset: Dispatch<SetStateAction<Ruleset>>;
}) {
  const [specieModal, setSpecieModal] = useState<{ specie: RulesetSpecie; isNew: boolean } | null>(null);

  const openNewSpecie = () => setSpecieModal({
    isNew: true,
    specie: {
      id: crypto.randomUUID(), name: "", size: ["medium"], description: "",
      unit: "ft", movements: [], senses: [], traitAssignments: [],
      statModifiers: {},
      damageResistances: [], damageImmunities: [], conditionImmunities: [], damageVulnerabilities: [],
    },
  });

  const saveSpecie = (specie: RulesetSpecie) => {
    setRuleset(prev => {
      const exists = prev.species.some(x => x.id === specie.id);
      const updated = { ...prev, species: exists ? prev.species.map(x => x.id === specie.id ? specie : x) : [...prev.species, specie] };
      invoke("save_ruleset", { ruleset: updated }).catch(() => {});
      return updated;
    });
    setSpecieModal(null);
  };

  const removeSpecie = (id: string) => {
    setRuleset(prev => {
      const updated = { ...prev, species: prev.species.filter(x => x.id !== id) };
      invoke("save_ruleset", { ruleset: updated }).catch(() => {});
      return updated;
    });
  };

  const onCreateTrait = (name: string): string => {
    const id = crypto.randomUUID();
    const newTrait: RulesetSpecieTrait = { id, name, description: "", fields: [] };
    setRuleset(r => ({ ...r, traits: [...r.traits, newTrait] }));
    return id;
  };

  return <>
    <SectionHeader
      title="Species"
      action={
        <button
          className="h-7! text-[11px]! px-2.5! gap-1.5! border-gold-500/30! text-gold-500! shrink-0"
          onClick={openNewSpecie}
        >
          <Plus className="h-3 w-3" /> Add Specie
        </button>
      }
    />
    <SectionBody>
      {ruleset.species.length === 0
        ? <p className="text-gold-700 text-xs px-4">No species defined yet.</p>
        : <div className="flex flex-col gap-3 px-4 pb-4">
            {ruleset.species.map(specie => (
              <SpecieCard
                key={specie.id}
                specie={specie}
                traits={ruleset.traits}
                onEdit={() => setSpecieModal({ specie: { ...specie, traitAssignments: specie.traitAssignments ?? [] }, isNew: false })}
                onDelete={() => removeSpecie(specie.id)}
              />
            ))}
          </div>
      }
    </SectionBody>
    {specieModal && (
      <SpecieModal
        specie={specieModal.specie}
        isNew={specieModal.isNew}
        availableTraits={ruleset.traits}
        onCreateTrait={onCreateTrait}
        onSave={saveSpecie}
        onClose={() => setSpecieModal(null)}
      />
    )}
    

  </>
}
