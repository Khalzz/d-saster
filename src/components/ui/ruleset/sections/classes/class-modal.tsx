import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, GripVertical, Plus, X } from "lucide-react";
import Field from "../../../Field";
import { NumberInput } from "../../../NumberInput";
import { Markdown } from "../../../Markdown";
import { TraitPickerModal } from "../TraitPickerModal";
import { TraitModal } from "../traits/trait-modal";
import type { RulesetClass, RulesetClassLevelFeature, RulesetSpecieTrait, StatDefinition, RulesetSkill } from "../../../../../pages/ruleset/ruleset-editor";

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-md border border-gold-500/30 p-3">
      <span className="absolute top-0 left-3 h-2 flex items-center -translate-y-1/2 px-1.5 bg-surface text-[10px] font-semibold uppercase tracking-widest text-gold-500/50 select-none">
        {title}
      </span>
      {children}
    </div>
  );
}

function useDropdownPos(triggerRef: React.RefObject<HTMLButtonElement | null>) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const open = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < 200 && r.top > spaceBelow)
      setPos({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width });
    else
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };
  useEffect(() => {
    if (!pos) return;
    const h = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-portal-dropdown]")) setPos(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [pos]);
  return { pos, open, close: () => setPos(null) };
}

function SingleSelectDropdown({ options, value, onChange, placeholder }: {
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { pos, open, close } = useDropdownPos(triggerRef);
  const selected = options.find(o => o.value === value);
  return (
    <>
      <button ref={triggerRef} type="button" className="w-full flex justify-between items-center px-3 gap-2" onClick={open}>
        <span className={`text-xs truncate flex-1 text-left ${selected ? "text-gold-300" : "text-gold-600"}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={`h-3 w-3 text-gold-500 shrink-0 transition-transform ${pos ? "rotate-180" : ""}`} />
      </button>
      {pos && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={close} />
          <div data-portal-dropdown style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, zIndex: 999 }}
            className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
            {options.map(opt => (
              <div key={opt.value}
                className={`px-3 py-2 cursor-pointer text-xs hover:bg-gold-500/10 transition-colors ${value === opt.value ? "text-gold-300 bg-gold-500/10" : "text-gold-400"}`}
                onClick={() => { onChange(opt.value); close(); }}
              >{opt.label}</div>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function MultiSelectDropdown({ options, selected, onChange, placeholder, selectAll = false }: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  selectAll?: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { pos, open, close } = useDropdownPos(triggerRef);
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  const selectedLabels = options.filter(o => selected.includes(o.value)).map(o => o.label);
  const allSelected = selectAll && options.length > 0 && options.every(o => selected.includes(o.value));
  const triggerText = allSelected ? "Any skill" : selectedLabels.length ? selectedLabels.join(", ") : placeholder;
  return (
    <>
      <button ref={triggerRef} type="button" className="w-full flex justify-between items-center px-3 gap-2" onClick={open}>
        <span className={`text-xs truncate flex-1 text-left ${selectedLabels.length ? "text-gold-300" : "text-gold-600"}`}>
          {triggerText}
        </span>
        <ChevronDown className={`h-3 w-3 text-gold-500 shrink-0 transition-transform ${pos ? "rotate-180" : ""}`} />
      </button>
      {pos && createPortal(
        <>
          <div className="fixed inset-0 z-998" onClick={close} />
          <div data-portal-dropdown style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, zIndex: 999 }}
            className="bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
            {options.length === 0
              ? <p className="text-gold-700 text-xs px-3 py-2">No options available.</p>
              : <>
                  {selectAll && options.length > 0 && (() => {
                    const allSelected = options.every(o => selected.includes(o.value));
                    return (
                      <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gold-500/10 border-b border-gold-500/10 transition-colors"
                        onClick={() => onChange(allSelected ? [] : options.map(o => o.value))}>
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${allSelected ? "bg-gold-500 border-gold-500" : "border-gold-500/30"}`}>
                          {allSelected && <Check className="h-2.5 w-2.5 text-gray-900" />}
                        </span>
                        <span className="text-xs text-gold-500 font-medium">Any skill</span>
                      </div>
                    );
                  })()}
                  {options.map(opt => {
                    const active = selected.includes(opt.value);
                    return (
                      <div key={opt.value}
                        className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gold-500/10 transition-colors ${active ? "bg-gold-500/10" : ""}`}
                        onClick={() => toggle(opt.value)}>
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${active ? "bg-gold-500 border-gold-500" : "border-gold-500/30"}`}>
                          {active && <Check className="h-2.5 w-2.5 text-gray-900" />}
                        </span>
                        <span className={`text-xs ${active ? "text-gold-300" : "text-gold-400"}`}>{opt.label}</span>
                      </div>
                    );
                  })}
                </>
            }
          </div>
        </>,
        document.body
      )}
    </>
  );
}


function LevelFeatureModal({ entry: initial, isNew, availableTraits, onCreateTrait, onUpdateTrait, onDelete, onSave, onClose }: {
  entry: RulesetClassLevelFeature;
  isNew: boolean;
  availableTraits: RulesetSpecieTrait[];
  onCreateTrait: (trait: RulesetSpecieTrait) => void;
  onUpdateTrait: (trait: RulesetSpecieTrait) => void;
  onDelete?: () => void;
  onSave: (entry: RulesetClassLevelFeature) => void;
  onClose: () => void;
}) {
  const [entry, setEntry] = useState<RulesetClassLevelFeature>(initial);
  const [traitPickerOpen, setTraitPickerOpen] = useState(false);
  const [editingTrait, setEditingTrait] = useState<RulesetSpecieTrait | null>(null);

  const patchEntry = (p: Partial<RulesetClassLevelFeature>) => setEntry(e => ({ ...e, ...p }));
  const assignedTraits = entry.traitIds
    .map(id => availableTraits.find(t => t.id === id))
    .filter((t): t is RulesetSpecieTrait => !!t);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-surface border border-gold-500/20 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
            <h2 className="text-gold-300 font-semibold text-sm flex-1">
              {isNew ? "Add Level Feature" : "Edit Level Feature"}
            </h2>
            <button type="button" className="w-6! h-6! min-w-0! p-0! bg-transparent! border-0! text-gold-600! hover:text-gold-300!" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <Field label="Level">
              <input
                type="number"
                min={1}
                className="bg-base border border-gold-500/30 rounded-md px-2 h-9 text-xs text-gold-400 w-full outline-none focus:border-gold-500/50 caret-gold-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                value={entry.level}
                onChange={e => patchEntry({ level: Math.max(1, parseInt(e.target.value) || 1) })}
                autoFocus
              />
            </Field>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-500/50 select-none">Traits</span>
              {assignedTraits.map(t => (
                <div
                  key={t.id}
                  className="border border-gold-500/20 rounded-lg px-3 py-2 flex flex-col gap-2 cursor-pointer hover:border-gold-500/40 transition-colors"
                  onClick={() => setEditingTrait(t)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gold-300 text-xs font-semibold">{t.name || <span className="italic text-gold-600">Unnamed</span>}</span>
                    <button
                      type="button"
                      className="w-5! h-5! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-[#ef4444]! shrink-0"
                      onClick={e => { e.stopPropagation(); patchEntry({ traitIds: entry.traitIds.filter(id => id !== t.id) }); }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {t.description && <Markdown className="text-[11px] text-gold-600">{t.description}</Markdown>}
                </div>
              ))}
              <button
                type="button"
                className="w-full! h-8! text-[11px]! gap-1.5! bg-transparent! border! border-dashed! border-gold-500/20! rounded-lg! text-gold-600! hover:text-gold-400! hover:border-gold-500/40!"
                onClick={() => setTraitPickerOpen(true)}
              >
                <Plus className="h-3 w-3" /> Add Trait
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 border-t border-gold-500/20 shrink-0">
            {onDelete && (
              <button
                className="px-4! h-8! text-xs! border-red-500/30! text-red-400! hover:bg-red-500/10! hover:border-red-500/50! mr-auto!"
                onClick={onDelete}
              >
                Delete
              </button>
            )}
            <button className="px-4! h-8! text-xs! border-gold-500/30! text-gold-500!" onClick={onClose}>Cancel</button>
            <button
              className="px-4! h-8! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
              onClick={() => onSave(entry)}
            >
              {isNew ? "Add" : "Save"}
            </button>
          </div>
        </div>
      </div>
      {traitPickerOpen && (
        <TraitPickerModal
          availableTraits={availableTraits}
          selectedIds={entry.traitIds}
          onToggle={id => {
            const exists = entry.traitIds.includes(id);
            patchEntry({ traitIds: exists ? entry.traitIds.filter(tid => tid !== id) : [...entry.traitIds, id] });
          }}
          onCreate={trait => {
            onCreateTrait(trait);
            patchEntry({ traitIds: [...entry.traitIds, trait.id] });
          }}
          onClose={() => setTraitPickerOpen(false)}
        />
      )}
      {editingTrait && createPortal(
        <div className="fixed inset-0 z-300">
          <TraitModal
            trait={editingTrait}
            isNew={false}
            onSave={trait => { onUpdateTrait(trait); setEditingTrait(null); }}
            onClose={() => setEditingTrait(null)}
          />
        </div>,
        document.body
      )}
    </>,
    document.body
  );
}

type FeatureTableData = NonNullable<RulesetClass["featureTable"]>;
type ColumnType = "text" | "traits";

function ColumnConfigModal({ initial, onSave, onDelete, onClose }: {
  initial: { label: string; type: ColumnType; autofill?: boolean };
  onSave: (cfg: { label: string; type: ColumnType; autofill: boolean }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(initial.label);
  const [type, setType] = useState<ColumnType>(initial.type);
  const [autofill, setAutofill] = useState(initial.autofill ?? false);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-surface border border-gold-500/20 rounded-xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
            <h2 className="text-gold-300 font-semibold text-sm flex-1">
              {onDelete ? "Edit Column" : "Add Column"}
            </h2>
            <button type="button" className="w-6! h-6! min-w-0! p-0! bg-transparent! border-0! text-gold-600! hover:text-gold-300!" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <Field label="Name">
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Level, Class Feature…"
                autoFocus
              />
            </Field>
            <Field label="Type">
              <SingleSelectDropdown
                options={[
                  { value: "text", label: "Text" },
                  { value: "traits", label: "Trait List" },
                ]}
                value={type}
                onChange={v => { setType(v as ColumnType); if (v !== "text") setAutofill(false); }}
                placeholder="Select type…"
              />
            </Field>
            {type === "text" && (
              <button
                type="button"
                className={`w-full! h-8! text-xs! justify-start! px-3! gap-2! ${autofill ? "bg-gold-500/10! border-gold-500/40! text-gold-300!" : "bg-transparent! border-gold-500/20! text-gold-600!"}`}
                onClick={() => setAutofill(v => !v)}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${autofill ? "bg-gold-500 border-gold-500" : "border-gold-500/40"}`}>
                  {autofill && <Check className="h-2.5 w-2.5 text-gray-900" />}
                </span>
                Autofill down to next change
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-4 py-3 border-t border-gold-500/20 shrink-0">
            {onDelete && (
              <button
                className="px-3! h-8! text-xs! border-red-500/30! text-red-400! hover:bg-red-500/10! hover:border-red-500/50!"
                onClick={onDelete}
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button className="px-3! h-8! text-xs! border-gold-500/30! text-gold-500!" onClick={onClose}>Cancel</button>
            <button
              className="px-3! h-8! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400!"
              onClick={() => onSave({ label, type, autofill })}
              disabled={!label.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

function FeatureTable({ table, onChange, availableTraits }: {
  table: FeatureTableData;
  onChange: (t: FeatureTableData) => void;
  availableTraits: RulesetSpecieTrait[];
}) {
  const [configuring, setConfiguring] = useState<{ colId: string | null } | null>(null);
  const [traitPickerCell, setTraitPickerCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const addColumn = (cfg: { label: string; type: ColumnType; autofill: boolean }) => {
    const id = crypto.randomUUID();
    onChange({
      columns: [...table.columns, { id, label: cfg.label, type: cfg.type, autofill: cfg.autofill }],
      rows: table.rows.map(r => ({ ...r, cells: { ...r.cells, [id]: cfg.type === "traits" ? [] : "" } })),
    });
  };

  const updateColumn = (colId: string, cfg: { label: string; type: ColumnType; autofill: boolean }) => {
    const prev = table.columns.find(c => c.id === colId);
    const typeChanged = prev?.type !== cfg.type;
    onChange({
      columns: table.columns.map(c => c.id === colId ? { ...c, ...cfg } : c),
      rows: typeChanged
        ? table.rows.map(r => ({ ...r, cells: { ...r.cells, [colId]: cfg.type === "traits" ? [] : "" } }))
        : table.rows,
    });
  };

  const removeColumn = (colId: string) => {
    onChange({
      columns: table.columns.filter(c => c.id !== colId),
      rows: table.rows.map(r => { const cells = { ...r.cells }; delete cells[colId]; return { ...r, cells }; }),
    });
  };

  const addRow = () => {
    const cells: Record<string, string | string[]> = {};
    table.columns.forEach(c => { cells[c.id] = c.type === "traits" ? [] : ""; });
    onChange({ ...table, rows: [...table.rows, { id: crypto.randomUUID(), cells }] });
  };

  const removeRow = (rowId: string) =>
    onChange({ ...table, rows: table.rows.filter(r => r.id !== rowId) });

  const updateCell = (rowId: string, colId: string, value: string | string[]) =>
    onChange({ ...table, rows: table.rows.map(r => r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r) });

  const reorderRows = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const rows = [...table.rows];
    const fromIdx = rows.findIndex(r => r.id === fromId);
    const toIdx = rows.findIndex(r => r.id === toId);
    const [moved] = rows.splice(fromIdx, 1);
    rows.splice(toIdx, 0, moved);
    onChange({ ...table, rows });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="overflow-x-auto rounded-md border border-gold-500/20">
          <table className="w-auto border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-gold-500/20 divide-x divide-gold-500/15">
                <th className="w-5 px-1" />
                {table.columns.map(col => (
                  <th key={col.id} className="px-2 py-1.5 text-left">
                    <button
                      type="button"
                      className="bg-transparent! border-0! h-auto! p-0! text-gold-500/70! font-semibold! text-[11px]! hover:text-gold-300! w-full! text-left! justify-start!"
                      onClick={() => setConfiguring({ colId: col.id })}
                    >
                      {col.label || <span className="italic text-gold-700 font-normal">Unnamed</span>}
                      {col.type === "traits" && <span className="ml-1 text-gold-700 font-normal text-[10px]">(traits)</span>}
                    </button>
                  </th>
                ))}
                <th className="w-8 px-1 py-1.5">
                  <button
                    type="button"
                    className="w-5! h-5! min-w-0! p-0! bg-transparent! border! border-dashed! border-gold-500/30! text-gold-600! hover:text-gold-300! hover:border-gold-500/50! rounded!"
                    onClick={() => setConfiguring({ colId: null })}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr
                  key={row.id}
                  draggable
                  onDragStart={() => setDraggingId(row.id)}
                  onDragOver={e => { e.preventDefault(); setDragOverId(row.id); }}
                  onDrop={() => { if (draggingId) reorderRows(draggingId, row.id); setDraggingId(null); setDragOverId(null); }}
                  onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                  className={`group transition-opacity divide-x divide-gold-500/15 ${draggingId === row.id ? "opacity-30" : ""} ${dragOverId === row.id && draggingId !== row.id ? "border-t-2 border-t-gold-400" : i < table.rows.length - 1 ? "border-b border-gold-500/10" : ""}`}
                >
                  <td className="px-1 py-1 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-3 w-3 text-gold-800 group-hover:text-gold-600 transition-colors" />
                  </td>
                  {table.columns.map(col => {
                    const colType = col.type ?? "text";
                    if (colType === "traits") {
                      const ids = (row.cells[col.id] as string[] | undefined) ?? [];
                      const names = ids.map(id => availableTraits.find(t => t.id === id)?.name).filter(Boolean);
                      return (
                        <td
                          key={col.id}
                          className="px-2 py-1 cursor-pointer hover:bg-gold-500/5 transition-colors"
                          onClick={() => setTraitPickerCell({ rowId: row.id, colId: col.id })}
                        >
                          {names.length > 0
                            ? <span className="text-gold-400 text-xs leading-snug">{names.join(", ")}</span>
                            : <span className="text-gold-700 text-xs italic">None</span>
                          }
                        </td>
                      );
                    }
                    const cellVal = (row.cells[col.id] as string) ?? "";
                    const carryVal = col.autofill && cellVal === "" ? (() => {
                      const rowIdx = table.rows.indexOf(row);
                      for (let i = rowIdx - 1; i >= 0; i--) {
                        const v = (table.rows[i].cells[col.id] as string) ?? "";
                        if (v !== "") return v;
                      }
                      return "";
                    })() : "";
                    return (
                      <td key={col.id} className="px-2 py-1">
                        <input
                          className="w-full bg-transparent! border-none! h-auto! px-1! py-0.5! text-xs! text-gold-400! outline-none! caret-gold-500 placeholder:text-gold-700/60!"
                          value={cellVal}
                          placeholder={carryVal || undefined}
                          onChange={e => updateCell(row.id, col.id, e.target.value)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-1 py-1 text-center">
                    <button
                      type="button"
                      className="w-5! h-5! min-w-0! p-0! bg-transparent! border-0! text-gold-700! hover:text-red-400! opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeRow(row.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="w-full! h-8! text-xs! gap-1.5! bg-transparent! border! border-dashed! border-gold-500/20! rounded-lg! text-gold-600! hover:text-gold-400! hover:border-gold-500/40!"
          onClick={addRow}
          disabled={table.columns.length === 0}
        >
          <Plus className="h-3 w-3" /> Add Row
        </button>
      </div>

      {configuring !== null && (() => {
        const existing = configuring.colId ? table.columns.find(c => c.id === configuring.colId) : null;
        return (
          <ColumnConfigModal
            initial={{ label: existing?.label ?? "", type: (existing?.type ?? "text") as ColumnType, autofill: existing?.autofill ?? false }}
            onSave={cfg => {
              if (configuring.colId) updateColumn(configuring.colId, cfg);
              else addColumn(cfg);
              setConfiguring(null);
            }}
            onDelete={configuring.colId ? () => { removeColumn(configuring.colId!); setConfiguring(null); } : undefined}
            onClose={() => setConfiguring(null)}
          />
        );
      })()}

      {traitPickerCell && (
        <TraitPickerModal
          availableTraits={availableTraits}
          selectedIds={(table.rows.find(r => r.id === traitPickerCell.rowId)?.cells[traitPickerCell.colId] as string[] | undefined) ?? []}
          onToggle={id => {
            const row = table.rows.find(r => r.id === traitPickerCell.rowId);
            const current = (row?.cells[traitPickerCell.colId] as string[] | undefined) ?? [];
            updateCell(traitPickerCell.rowId, traitPickerCell.colId, current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
          }}
          onClose={() => setTraitPickerCell(null)}
        />
      )}
    </>
  );
}

export interface ClassInlineEditorHandle {
  getCurrentCls: () => RulesetClass;
}

export const ClassInlineEditor = forwardRef<ClassInlineEditorHandle, {
  cls: RulesetClass;
  isNew: boolean;
  stats: StatDefinition[];
  skills: RulesetSkill[];
  traits: RulesetSpecieTrait[];
  onCreateTrait: (trait: RulesetSpecieTrait) => void;
  onUpdateTrait: (trait: RulesetSpecieTrait) => void;
  onNameChange?: (name: string) => void;
}>(function ClassInlineEditor({ cls: initial, stats, skills, traits, onCreateTrait, onUpdateTrait, onNameChange }, ref) {
  const [cls, setCls] = useState<RulesetClass>(() => {
    if (initial.featureTable) return initial;
    const levelColId = crypto.randomUUID();
    const traitsColId = crypto.randomUUID();
    return {
      ...initial,
      featureTable: {
        columns: [
          { id: levelColId, label: "Level", type: "text" },
          { id: traitsColId, label: "Class Features", type: "traits" },
        ],
        rows: [{ id: crypto.randomUUID(), cells: { [levelColId]: "1", [traitsColId]: [] } }],
      },
    };
  });
  const patch = (p: Partial<RulesetClass>) => setCls(c => ({ ...c, ...p }));

  useImperativeHandle(ref, () => ({ getCurrentCls: () => cls }), [cls]);

  const [levelModal, setLevelModal] = useState<{ entry: RulesetClassLevelFeature; idx: number | null } | null>(null);

  const removeLevel = (idx: number) =>
    patch({ levelFeatures: cls.levelFeatures.filter((_, i) => i !== idx) });

  const openAddLevel = () => {
    const next = cls.levelFeatures.length > 0 ? Math.max(...cls.levelFeatures.map(lf => lf.level)) + 1 : 1;
    setLevelModal({ entry: { level: next, traitIds: [] }, idx: null });
  };

  const saveLevel = (entry: RulesetClassLevelFeature) => {
    if (levelModal!.idx === null) {
      patch({ levelFeatures: [...cls.levelFeatures, entry] });
    } else {
      patch({ levelFeatures: cls.levelFeatures.map((lf, i) => i === levelModal!.idx ? entry : lf) });
    }
    setLevelModal(null);
  };

  return (
    <>
      <div className="bg-surface border-x border-gold-500/20 p-4 flex flex-col gap-3">
        <ModalSection title="Identity">
          <div className="flex flex-col gap-3">
            <Field label="Name">
              <input
                className="bg-base border border-gold-500/30 rounded-md px-2 h-9 text-xs text-gold-400 w-full outline-none focus:border-gold-500/50 caret-gold-500"
                value={cls.name}
                onChange={e => { patch({ name: e.target.value }); onNameChange?.(e.target.value); }}
                placeholder="e.g. Barbarian, Wizard…"
                autoFocus
              />
            </Field>
            <Field label="Description">
              <textarea
                className="w-full rounded-md px-2.5 py-2 border border-gold-500/20 bg-base text-gold-200 text-xs resize-y outline-none focus:border-gold-500/40 transition-colors placeholder:text-gold-700 font-sans"
                rows={10}
                value={cls.description}
                onChange={e => patch({ description: e.target.value })}
                placeholder="Describe this class… (markdown supported)"
              />
            </Field>
          </div>
        </ModalSection>

        <ModalSection title="Core Class Traits">
          <div className="flex flex-col gap-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primary Ability">
                <SingleSelectDropdown
                  value={cls.primaryAbility || null}
                  options={stats.map(s => ({ value: s.key, label: s.label }))}
                  onChange={v => patch({ primaryAbility: v })}
                  placeholder="Select stat…"
                />
              </Field>
              <Field label="Hit Point Die">
                <input
                  className="bg-base border border-gold-500/30 rounded-md px-2 text-xs text-gold-400 w-full outline-none focus:border-gold-500/50 caret-gold-500"
                  value={cls.hitDie}
                  onChange={e => patch({ hitDie: e.target.value })}
                  placeholder="e.g. D12, 2D6…"
                />
              </Field>
            </div>

            <Field label="Saving Throw Proficiencies">
              <MultiSelectDropdown
                options={stats.map(s => ({ value: s.key, label: s.label }))}
                selected={cls.savingThrowProficiencies}
                onChange={next => patch({ savingThrowProficiencies: next })}
                placeholder="Select stats…"
              />
            </Field>

            <Field label="Skill Proficiencies">
              <div className="flex items-center gap-2">
                <span className="text-gold-600 text-xs shrink-0">Choose</span>
                <NumberInput
                  value={cls.skillProficiencies.count}
                  onChange={v => patch({ skillProficiencies: { ...cls.skillProficiencies, count: v } })}
                  min={0}
                  className="w-16"
                />
                <span className="text-gold-600 text-xs shrink-0">from:</span>
                <div className="flex-1">
                  <MultiSelectDropdown
                    options={skills.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: s.name }))}
                    selected={cls.skillProficiencies.options}
                    onChange={next => patch({ skillProficiencies: { ...cls.skillProficiencies, options: next } })}
                    placeholder="Select skills…"
                    selectAll
                  />
                </div>
              </div>
            </Field>
          </div>
        </ModalSection>

        <ModalSection title="Features">
          <div className="pt-1">
            <FeatureTable
              table={cls.featureTable ?? { columns: [], rows: [] }}
              onChange={t => patch({ featureTable: t })}
              availableTraits={traits}
            />
          </div>
        </ModalSection>

        {cls.levelFeatures
          .slice()
          .sort((a, b) => a.level - b.level)
          .map(lf => {
            const realIdx = cls.levelFeatures.indexOf(lf);
            return (
              <div
                key={realIdx}
                className="relative rounded-md border border-gold-500/20 px-3 pb-3 pt-4 cursor-pointer hover:border-gold-500/40 transition-colors"
                onClick={() => setLevelModal({ entry: { ...lf }, idx: realIdx })}
              >
                <div className="absolute top-0 left-3 flex items-center -translate-y-1/2">
                  <span className="px-1.5 bg-surface text-[10px] font-semibold uppercase tracking-widest text-gold-500/50 select-none">
                    Level {lf.level}
                  </span>
                </div>
                {lf.traitIds.length === 0 ? (
                  <p className="text-gold-700 text-xs italic">No traits assigned.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {lf.traitIds.map(id => {
                      const trait = traits.find(t => t.id === id);
                      if (!trait) return null;
                      return (
                        <div key={id} className="border border-gold-500/10 rounded-md px-3 py-2 flex flex-col gap-1">
                          <span className="text-gold-300 text-lg font-semibold leading-tight">{trait.name || <span className="italic text-gold-600">Unnamed</span>}</span>
                          {trait.description && <Markdown className="text-[11px] text-gold-600">{trait.description}</Markdown>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        <button
          type="button"
          className="w-full! h-9! text-xs! gap-1.5! bg-transparent! border! border-dashed! border-gold-500/20! rounded-lg! text-gold-600! hover:text-gold-400! hover:border-gold-500/40!"
          onClick={openAddLevel}
        >
          <Plus className="h-3 w-3" /> Add Level
        </button>

      </div>

      {levelModal && (
        <LevelFeatureModal
          entry={levelModal.entry}
          isNew={levelModal.idx === null}
          availableTraits={traits}
          onCreateTrait={onCreateTrait}
          onUpdateTrait={onUpdateTrait}
          onDelete={levelModal.idx !== null ? () => { removeLevel(levelModal.idx!); setLevelModal(null); } : undefined}
          onSave={saveLevel}
          onClose={() => setLevelModal(null)}
        />
      )}
    </>
  );
});
