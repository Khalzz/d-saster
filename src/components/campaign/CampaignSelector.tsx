import { Trash2 } from "lucide-react";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  tags: string[];
  color: string;
  image?: string;
  scenes?: string[];
}

const PRESET_COLORS = [
  "#1a2d1f", "#1a1f2d", "#2a1f3d", "#2d1a1a",
  "#2d2a1a", "#1a2a2d", "#3d2a1a",
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-row gap-2">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-8! h-8! rounded-md! border! transition-transform! ${value === c ? "border-gold-400! scale-110" : "border-gold-500/30!"}`}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

export default function CampaignCard({ campaign, onClick, onDelete }: { campaign: Campaign; onClick?: () => void; onDelete?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group rounded-xl overflow-hidden border border-gold-500/20 hover:border-gold-500/60 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-gold-950/50 select-none relative"
    >
      <div className="h-36 w-full relative" style={{ background: campaign.color }}>
        {campaign.image && (
          <img src={campaign.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        {onDelete && (
          <button
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="bg-surface px-4 py-3 flex flex-col gap-1.5 h-full">
        <p className="font-bold text-gold-400 truncate text-sm">{campaign.title}</p>
        {campaign.description && (
          <p className="text-gold-600 text-xs line-clamp-2 leading-relaxed">{campaign.description}</p>
        )}
        {campaign.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {campaign.tags.map(tag => (
              <span key={tag} className="text-[10px] text-gold-700 border border-gold-500/20 rounded px-1.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
