import { useRef } from "react";
import { UserRound, Sword, ImagePlus, X } from "lucide-react";

interface Props {
  image?: string;
  type: "player" | "npc";
  onImageChange: (img: string | undefined) => void;
  onTypeChange: (type: "player" | "npc") => void;
}

export function PortraitPicker({ image, type, onImageChange, onTypeChange }: Props) {
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onImageChange(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="w-full flex flex-col gap-1">
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

      <div
        className="w-full aspect-square rounded-lg border border-gold-500/30 bg-surface overflow-hidden flex flex-col items-center justify-center cursor-pointer relative group hover:border-gold-500/70 transition-colors"
        onClick={() => imgInputRef.current?.click()}
      >
        {image ? (
          <>
            <img src={image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <ImagePlus className="h-5 w-5 text-gold-400" />
              <span className="text-gold-400 text-xs">Replace</span>
            </div>
            <button
              className="absolute top-1.5 right-1.5 w-6! h-6! min-w-0! p-0! opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onImageChange(undefined); }}
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gold-700 group-hover:text-gold-500 transition-colors pointer-events-none">
            <UserRound className="h-10 w-10" />
            <span className="text-xs">Add portrait</span>
          </div>
        )}
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gold-500/40 w-full mt-1">
        <button
          className={`flex-1 h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 ${type === "player" ? "bg-gold-500! text-gray-900!" : "bg-transparent! text-gold-500! hover:bg-gold-500/10!"}`}
          onClick={() => onTypeChange("player")}
        >
          <UserRound className="h-3.5 w-3.5" /> Player
        </button>
        <div className="w-px bg-gold-500/40 shrink-0" />
        <button
          className={`flex-1 h-8! text-xs! border-0! rounded-none! flex items-center justify-center gap-1.5 ${type === "npc" ? "bg-gold-500! text-gray-900!" : "bg-transparent! text-gold-500! hover:bg-gold-500/10!"}`}
          onClick={() => onTypeChange("npc")}
        >
          <Sword className="h-3.5 w-3.5" /> NPC
        </button>
      </div>
    </div>
  );
}
