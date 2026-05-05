import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface ExpandableItem {
  label: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface ExpandableProps {
  name: string;
  icon?: React.ReactNode;
  count?: number;
  items: ExpandableItem[];
  defaultOpen?: boolean;
}

export default function Expandable({ name, icon, count, items, defaultOpen = false }: ExpandableProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!defaultOpen) setIsOpen(false);
  }, [defaultOpen]);

  const open = defaultOpen || isOpen;

  return (
    <div className="flex flex-col">
      <div
        className="w-full hover:bg-gold-500/10 transition-colors cursor-pointer select-none p-4 text-gold-500 flex flex-row justify-between border-t border-gold-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="flex items-center gap-2">{icon}{name}</p>
        {count !== undefined && <p className="text-gold-700 text-sm">{items.length} found</p>}
      </div>
      <div
        ref={contentRef}
        className="overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out bg-[#121212] text-gold-500"
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight ?? 1000 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="hover:bg-gold-900 w-full h-fit cursor-pointer transition-colors p-2 px-6 flex justify-between items-center group"
            onClick={item.onClick}
          >
            <span className="truncate flex-1">{item.label}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.onEdit && (
                <div
                  className="text-gold-500 hover:text-gold-300 cursor-pointer p-1"
                  onClick={(e) => { e.stopPropagation(); item.onEdit?.(); }}
                >
                  <Pencil size={13} />
                </div>
              )}
              {item.onDelete && (
                <div
                  className="text-[#ef4444] hover:text-[#f87171] cursor-pointer p-1"
                  onClick={(e) => { e.stopPropagation(); item.onDelete?.(); }}
                >
                  <Trash2 size={13} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
