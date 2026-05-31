import { UserRound, ImagePlus } from "lucide-react";
import type { ImageSettings } from "../../../types";
import type { NodePreviewProps } from "../types";

export function ImagePreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { width, height, squared, padding } = node.settings as ImageSettings;
  const isSelected = selectedIds.has(node.id);

  const containerStyle: React.CSSProperties = {
    padding,
    ...(width > 0 ? { width: `${width}%` } : {}),
    ...(height > 0 ? { height: `${height}%` } : {}),
    ...(squared && { aspectRatio: "1 / 1" }),
  };

  return (
    <div
      className={`rounded-lg border transition-colors cursor-pointer overflow-hidden relative group ${
        isSelected
          ? "border-gold-400 shadow-[0_0_0_1px_rgba(200,168,75,0.3)]"
          : "border-gold-500/30 hover:border-gold-500/70"
      }`}
      style={containerStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface text-gold-700 group-hover:text-gold-500 transition-colors">
        <UserRound className="h-10 w-10" />
        <span className="text-xs select-none">Add portrait</span>
      </div>
    </div>
  );
}
