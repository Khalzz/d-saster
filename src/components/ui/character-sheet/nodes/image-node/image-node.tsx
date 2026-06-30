import { useRef } from "react";
import { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import { ImageSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import { ImagePlus, UserRound, X } from "lucide-react";

// ── Image (portrait) ───────────────────────────────────────────────────────
export function ImageNode({ node, useSheet }: { node: LayoutNode, useSheet: () => SheetContext }) {
  const { width, height, squared, padding, grow } = node.settings as ImageSettings;
  const { char, onChange } = useSheet();
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ image: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const innerContent = (
    <>
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
      {char.image ? (
        <>
          <img src={char.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            <ImagePlus className="h-5 w-5 text-gold-400" />
            <span className="text-gold-400 text-xs">Replace</span>
          </div>
          <button
            className="absolute top-1.5 right-1.5 w-6! h-6! min-w-0! p-0! opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onChange({ image: undefined }); }}
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface text-gold-700 group-hover:text-gold-500 transition-colors">
          <UserRound className="h-10 w-10" />
          <span className="text-xs select-none">Add portrait</span>
        </div>
      )}
    </>
  );

  if (grow) {
    // Outer div: flex item with zero intrinsic height — doesn't inflate the flex line.
    // Inner div: absolute inset-0, fills the height set by align-self: stretch (= sibling height).
    const outerStyle: React.CSSProperties = width > 0
      ? { width: `${width}%`, flexShrink: 0, alignSelf: "stretch", position: "relative" }
      : { flex: "1 1 0%", minWidth: 0, alignSelf: "stretch", position: "relative" };
    return (
      <div style={outerStyle}>
        <div
          className="absolute inset-0 rounded-lg border border-gold-500/30 hover:border-gold-500/70 transition-colors cursor-pointer overflow-hidden group"
          style={{ padding }}
          onClick={() => imgInputRef.current?.click()}
        >
          {innerContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-gold-500/30 hover:border-gold-500/70 transition-colors cursor-pointer overflow-hidden relative group"
      style={{
        padding,
        ...(width > 0 ? { width: `${width}%` } : {}),
        ...(height > 0 ? { height: `${height}px` } : {}),
        ...(squared && { aspectRatio: "1 / 1" }),
      }}
      onClick={() => imgInputRef.current?.click()}
    >
      {innerContent}
    </div>
  );
}
