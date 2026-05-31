import { Rows3, Columns3 } from "lucide-react";
import type { ContainerSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function ContainerPreview({ node, selectedIds, onSelect, renderChildren }: NodePreviewProps) {
  const s = node.settings as ContainerSettings;
  const { padding, gap, direction } = s;
  const isSelected = selectedIds.has(node.id);

  const flexStyle: React.CSSProperties =
    s.width > 0
      ? { flex: `0 0 ${s.width}%`, maxWidth: `${s.width}%` }
      : { flex: "1 1 0%", minWidth: 0 };

  return (
    <div
      className={`rounded-md  transition-colors cursor-pointer min-h-[40px] ${
        isSelected
          ? "outline-dashed outline-1 outline-offset-4 outline-gold-400"
          : "outline-gold-500/15 hover:outline-gold-500/30"
      }`}
      style={{
        ...flexStyle,
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        padding,
        gap,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {node.children.length === 0 ? (
        <EmptySlot
          label={direction === "horizontal" ? "Columns" : "Rows"}
          icon={direction === "horizontal" ? <Columns3 className="h-3 w-3" /> : <Rows3 className="h-3 w-3" />}
        />
      ) : (
        renderChildren(node.children)
      )}
    </div>
  );
}

function EmptySlot({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-3 w-full">
      {icon && <span className="text-gold-700">{icon}</span>}
      <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
        {label}
      </span>
    </div>
  );
}
