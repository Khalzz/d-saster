import { UserRound } from "lucide-react";
import type { ImageSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function ImagePreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { width, height, squared, padding, grow } = node.settings as ImageSettings;
  const isSelected = selectedIds.has(node.id);

  const borderClass = isSelected
    ? "border-gold-400 shadow-[0_0_0_1px_rgba(200,168,75,0.3)]"
    : "border-gold-500/30 hover:border-gold-500/70";

  const content = (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface text-gold-700 hover:text-gold-500 transition-colors">
      <UserRound className="h-10 w-10" />
      <span className="text-xs select-none">Add portrait</span>
    </div>
  );

  if (grow) {
    // Outer div: flex item with zero intrinsic height — doesn't inflate the flex line.
    // Inner div: absolute inset, fills the height set by align-self: stretch (= sibling height).
    const outerStyle: React.CSSProperties = width > 0
      ? { width: `${width}%`, flexShrink: 0, alignSelf: "stretch", position: "relative" }
      : { flex: "1 1 0%", minWidth: 0, alignSelf: "stretch", position: "relative" };
    return (
      <div style={outerStyle}>
        <div
          className={`absolute inset-0 rounded-lg border transition-colors cursor-pointer overflow-hidden ${borderClass}`}
          style={{ padding }}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border transition-colors cursor-pointer overflow-hidden relative group ${borderClass}`}
      style={{
        padding,
        ...(width > 0 ? { width: `${width}%` } : {}),
        ...(height > 0 ? { height: `${height}px` } : {}),
        ...(squared && { aspectRatio: "1 / 1" }),
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
    >
      {content}
    </div>
  );
}
