import { CircleHelp } from "lucide-react";
import Tooltip from "../../../../../components/ui/tooltip/Tooltip";
import type { SectionSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function SectionPreview({ node, selectedIds, onSelect, renderChildren }: NodePreviewProps) {
  const { title, padding, gap, width, description } = node.settings as SectionSettings;
  const isSelected = selectedIds.has(node.id);

  return (
    <div
      className={`relative rounded-md border transition-colors cursor-pointer ${
        isSelected
          ? "border-gold-400 shadow-[0_0_0_1px_rgba(200,168,75,0.3)]"
          : "border-gold-500/30 hover:border-gold-500/40"
      }`}
      style={{ padding, paddingTop: padding, height: 'fit-content', ...(width > 0 ? { width: `${width}%` } : { width: '100%' }) }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <span className="absolute top-0 left-3 h-2 flex items-center -translate-y-1/2 px-1.5 bg-surface text-[10px] font-semibold uppercase tracking-widest text-gold-500/50 select-none gap-1">
        {title || "Section"}
        {description && (
          <Tooltip text={description}>
            <CircleHelp className="h-3 w-3 text-gold-600 hover:text-gold-400 transition-colors" />
          </Tooltip>
        )}
      </span>
      <div className="flex flex-col" style={{ gap }}>
        {node.children.length === 0 ? (
          <EmptySlot label="Empty section" />
        ) : (
          renderChildren(node.children)
        )}
      </div>
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-3 w-full">
      <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
        {label}
      </span>
    </div>
  );
}
