import { ChevronDown } from "lucide-react";
import type { ClassSelectorSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function ClassSelectorPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { label, allowMulticlass, padding } = node.settings as ClassSelectorSettings;
  const isSelected = selectedIds.has(node.id);

  return (
    <div
      className="rounded-xs transition-colors cursor-pointer w-full"
      style={{ padding }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {allowMulticlass ? (
        <div className={`flex flex-col rounded-lg border transition-colors ${
          isSelected ? "border-gold-400" : "border-gold-500/20"
        }`}>
          <div className="flex items-center justify-between px-2 pt-0.5">
            <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
              {label || "Class"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-gold-600 text-[9px] uppercase tracking-wider">Multiclass</span>
              <div className="relative w-7 h-4 rounded-full bg-gold-500/20">
                <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-gold-700" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 px-2 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-md px-2.5 py-2 border border-gold-500/20 bg-base">
                <div className="flex-1 min-w-0">
                  <p className="text-gold-600 text-xs font-medium truncate">No class selected</p>
                </div>
                <div className="w-6 h-6 shrink-0 rounded border border-gold-500/30 bg-transparent flex items-center justify-center">
                  <ChevronDown className="h-3 w-3 text-gold-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">
            {label || "Class"}
          </span>
          <div className={`flex items-center gap-2 rounded-md px-2.5 py-2 border transition-colors ${
            isSelected ? "border-gold-400" : "border-gold-500/20"
          } bg-base`}>
            <div className="flex-1 min-w-0">
              <p className="text-gold-600 text-xs font-medium truncate">No class selected</p>
            </div>
            <div className="w-6 h-6 shrink-0 rounded border border-gold-500/30 bg-transparent flex items-center justify-center">
              <ChevronDown className="h-3 w-3 text-gold-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
