import { useEffect, useRef, useState } from "react";
import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { ClassSelectorSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import { Check, ChevronDown, X } from "lucide-react";

export function ClassSelectorNode({ node, useSheet }: { node: LayoutNode, useSheet: () => SheetContext }) {
  const { label, padding } = node.settings as ClassSelectorSettings;
  const { char, onChange, classes } = useSheet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const multiclassEntries = char.multiclass ?? [];

  const toggle = (classId: string) => {
    const existing = multiclassEntries.find(m => m.classId === classId);
    if (existing) {
      onChange({ multiclass: multiclassEntries.filter(m => m.classId !== classId) });
    } else {
      onChange({ multiclass: [...multiclassEntries, { classId, level: 1 }] });
    }
  };

  const allSelected = [
    ...(char.classId ? [char.classId] : []),
    ...multiclassEntries.map(m => m.classId),
  ];

  return (
    <div className="w-full" style={{ padding }} ref={ref}>
      <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
        {label || "Class"}
      </span>
      <div className="relative">
        <div
          className="flex items-center gap-2 rounded-md px-2.5 py-2 border border-gold-500/20 bg-base cursor-pointer hover:border-gold-500/40 transition-colors"
          onClick={() => setOpen(v => !v)}
        >
          <p className={`flex-1 text-xs font-medium truncate ${allSelected.length ? "text-gold-300" : "text-gold-600"}`}>
            {allSelected.length
              ? classes.filter(c => allSelected.includes(c.id)).map(c => c.name).join(", ")
              : "No class selected"}
          </p>
          <ChevronDown className={`h-3 w-3 text-gold-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-surface border border-gold-500/40 rounded-lg overflow-hidden shadow-2xl">
            {classes.length === 0 ? (
              <div className="px-3 py-2 text-gold-700 text-xs">No classes in ruleset</div>
            ) : classes.map(cls => {
              const isSelected = allSelected.includes(cls.id);
              return (
                <div
                  key={cls.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gold-500/10 text-xs flex items-center gap-2 ${isSelected ? "text-gold-400 bg-gold-500/10" : "text-gold-300"}`}
                  onClick={() => {
                    if (cls.id === char.classId) {
                      onChange({ classId: undefined });
                    } else if (multiclassEntries.some(m => m.classId === cls.id)) {
                      toggle(cls.id);
                    } else if (!char.classId) {
                      onChange({ classId: cls.id });
                    } else {
                      toggle(cls.id);
                    }
                  }}
                >
                  <Check className={`h-3 w-3 shrink-0 ${isSelected ? "text-gold-400" : "opacity-0"}`} />
                  <span>{cls.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {allSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {classes.filter(c => allSelected.includes(c.id)).map(cls => (
            <div
              key={cls.id}
              className="flex items-center gap-1 bg-gold-500/10 border border-gold-500/30 rounded-md px-2 py-0.5 text-[10px] text-gold-300 font-medium"
            >
              <span>{cls.name}</span>
              {cls.id === char.classId
                ? <X className="h-3 w-3 text-gold-500 cursor-pointer hover:text-gold-300" onClick={() => onChange({ classId: undefined })} />
                : <X className="h-3 w-3 text-gold-500 cursor-pointer hover:text-gold-300" onClick={() => toggle(cls.id)} />
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
