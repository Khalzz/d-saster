import { useEffect, useRef, useState } from "react";
import Input from "../input/Input";
import Expandable from "../expandable/Expandable";
import { Plus, Trash2 } from "lucide-react";

export interface SearchCategoryItem {
  label: string;
  id?: string;
}

export interface SearchCategory {
  name: string;
  icon: React.ReactNode;
  items: SearchCategoryItem[];
  onCreate?: (name: string) => void;
  onSelect?: (item: SearchCategoryItem) => void;
  onEdit?: (item: SearchCategoryItem) => void;
  onDelete?: (item: SearchCategoryItem) => void;
}

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: SearchCategory[];
  placeholder?: string;
}

export default function SearchBar({ isOpen, onClose, categories, placeholder = "Search or name a thing..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<{ item: SearchCategoryItem; cat: SearchCategory } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (query.length > 0) {
          setQuery("");
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, query, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      inputRef.current?.blur();
    }
  }, [isOpen]);

  const filteredCategories = categories.map(cat => ({
    ...cat,
    filteredItems: cat.items.filter(item => item.label.toLowerCase().includes(query.toLowerCase())),
  })).filter(cat => cat.filteredItems.length > 0);

  const hasCreateActions = categories.some(cat => cat.onCreate);

  return (
    <>
    {pendingDelete ? (
      <div className="w-[600px] bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-[#ef4444]">
          <Trash2 size={20} />
          <span className="text-gold-400 font-medium">Delete {pendingDelete.cat.name.slice(0, -1)}</span>
        </div>
        <p className="text-gold-500 text-sm">
          Are you sure you want to delete <span className="text-gold-300 font-medium">"{pendingDelete.item.label}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button className="text-sm px-4!" onClick={() => setPendingDelete(null)}>
            Cancel
          </button>
          <button
            className="text-sm px-4! bg-[#ef4444]/10! border-[#ef4444]! text-[#ef4444]! hover:bg-[#ef4444]/20!"
            onClick={() => { pendingDelete.cat.onDelete!(pendingDelete.item); setPendingDelete(null); }}
          >
            Delete
          </button>
        </div>
      </div>
    ) : (
    <div className="flex flex-col items-center gap-2">
      <div className="w-[600px] bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 overflow-hidden">
        <Input
          ref={inputRef}
          className="w-full h-14! text-xl! border-none! rounded-xl! px-4!"
          placeholder={placeholder}
          value={query}
          onChange={(val) => setQuery(val)}
        />
        <div className="max-h-[500px] overflow-y-auto overscroll-none">

        {filteredCategories.map(cat => (
          <Expandable
            key={cat.name}
            name={cat.name}
            icon={cat.icon}
            count={cat.filteredItems.length}
            items={cat.filteredItems.map(item => ({
              label: item.label,
              onClick: cat.onSelect ? () => { cat.onSelect!(item); onClose(); } : undefined,
              onEdit: cat.onEdit ? () => { cat.onEdit!(item); onClose(); } : undefined,
              onDelete: cat.onDelete ? () => setPendingDelete({ item, cat }) : undefined,
            }))}
            defaultOpen={query.length > 0}
          />
        ))}
        </div>

      </div>
      {query.length > 0 && hasCreateActions && (
        <div className="flex flex-row gap-2 mt-2 flex-wrap">
          {categories.filter(cat => cat.onCreate).map(cat => {
            const duplicate = cat.items.some(item => item.label.toLowerCase() === query.toLowerCase());
            return duplicate ? (
              <span key={cat.name} className="text-xs text-gold-700 flex items-center gap-1 px-2">
                {cat.icon} "{query}" already exists in {cat.name}
              </span>
            ) : (
              <button
                key={cat.name}
                className="flex items-center gap-1 text-sm px-2"
                onClick={() => { cat.onCreate?.(query); setQuery(""); }}
              >
                <Plus className="h-3 w-3" />{cat.icon} {cat.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
    )}
    </>
  );
}
