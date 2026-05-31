import type { GridSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function GridPreview({ node, selectedIds, onSelect, renderChildren }: NodePreviewProps) {
  const { columns, rows, padding, gap } = node.settings as GridSettings;
  const isSelected = selectedIds.has(node.id);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    ...(rows > 0 && { gridTemplateRows: `repeat(${rows}, 1fr)` }),
    gap,
    padding,
  };

  return (
    <div
      className={`rounded-md outline-dashed outline-1 outline-offset-4 transition-colors cursor-pointer min-h-[40px] ${
        isSelected
          ? "outline-gold-400"
          : "outline-gold-500/15 hover:outline-gold-500/30"
      }`}
      style={gridStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {node.children.length === 0 ? (
        <div className="flex items-center justify-center gap-1.5 py-3 w-full col-span-full">
          <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
            Empty grid
          </span>
        </div>
      ) : (
        renderChildren(node.children)
      )}
    </div>
  );
}
