import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

interface ExpandableItem {
  label: string;
  onClick?: () => void;
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
        className="overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out bg-gold-950 text-gold-500"
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight ?? 1000 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="hover:bg-gold-800 w-full h-fit cursor-pointer transition-colors p-2 px-6 flex justify-between items-center group"
            onClick={item.onClick}
          >
            <span>{item.label}</span>
            {item.onDelete && (
              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 cursor-pointer p-1"
                onClick={(e) => { e.stopPropagation(); item.onDelete?.(); }}
              >
                <Trash2 size={14} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
