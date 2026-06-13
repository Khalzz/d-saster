import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import type { RulesetSpecieTrait } from "../../../../pages/ruleset/ruleset-editor";
import { TraitModal } from "./traits/trait-modal";

export function TraitPickerModal({ availableTraits, selectedIds, onToggle, onCreate, onClose }: {
  availableTraits: RulesetSpecieTrait[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate?: (trait: RulesetSpecieTrait) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [creatingTrait, setCreatingTrait] = useState<RulesetSpecieTrait | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (creatingTrait) setCreatingTrait(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(timer); window.removeEventListener("keydown", onKey); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatingTrait]);

  const filtered = availableTraits.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
  const canCreate = onCreate && query.trim() !== "" && !availableTraits.some(t => t.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-200 backdrop-blur-lg flex items-center justify-center p-4" onClick={onClose}>
          <div className="relative flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
            <div className="w-130 bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 overflow-hidden">
              <input
                ref={searchRef}
                className="w-full h-14 text-xl border-none! bg-transparent! text-gold-300 outline-none px-4 placeholder:text-gold-700 caret-gold-500"
                placeholder="Search traits…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <div className="max-h-64 overflow-y-auto border-t border-gold-500/20">
                {filtered.length === 0 && !canCreate && (
                  <p className="text-gold-700 text-xs px-4 py-3">No traits found.</p>
                )}
                {filtered.map(trait => {
                  const active = selectedIds.includes(trait.id);
                  return (
                    <div
                      key={trait.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gold-500/10 transition-colors ${active ? "bg-gold-500/10" : ""}`}
                      onClick={() => onToggle(trait.id)}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${active ? "bg-gold-500 border-gold-500" : "border-gold-500/30"}`}>
                        {active && <Check className="h-3 w-3 text-gray-900" />}
                      </span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={`text-sm font-medium ${active ? "text-gold-300" : "text-gold-400"}`}>
                          {trait.name || <span className="italic text-gold-700">Unnamed</span>}
                        </span>
                        {trait.description && (
                          <span className="text-gold-600 text-xs truncate">{trait.description}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {canCreate && (
              <button
                className="flex items-center gap-1.5 text-sm px-3!"
                onClick={() => {
                  setCreatingTrait({ id: crypto.randomUUID(), name: query.trim(), description: "", fields: [] });
                  setQuery("");
                }}
              >
                <Plus className="h-3 w-3" /> Create "{query.trim()}"
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
      {creatingTrait && createPortal(
        <div className="fixed inset-0 z-300">
          <TraitModal
            trait={creatingTrait}
            isNew={true}
            onSave={trait => {
              onCreate!(trait);
              setCreatingTrait(null);
              onClose();
            }}
            onClose={() => setCreatingTrait(null)}
          />
        </div>,
        document.body
      )}
    </>
  );
}
