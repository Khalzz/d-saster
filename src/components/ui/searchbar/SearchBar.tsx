import { useEffect, useRef, useState } from "react";
import Input from "../input/Input";
import Expandable from "../expandable/Expandable";
import Button from "../buttons/BaseButton";
import { Plus } from "lucide-react";

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
    <div className="flex flex-col items-center gap-2">
      <div className="w-[600px] bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 overflow-hidden">
        <Input
          ref={inputRef}
          className="w-full h-14! text-xl! border-none! rounded-xl! px-4!"
          placeholder={placeholder}
          value={query}
          onChange={(val) => setQuery(val)}
        />
        {filteredCategories.map(cat => (
          <Expandable
            key={cat.name}
            name={cat.name}
            icon={cat.icon}
            count={cat.filteredItems.length}
            items={cat.filteredItems.map(item => ({
              label: item.label,
              onClick: cat.onSelect ? () => { cat.onSelect!(item); onClose(); } : undefined,
            }))}
            defaultOpen={query.length > 0}
          />
        ))}
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
              <Button
                key={cat.name}
                className="flex items-center gap-1 text-sm"
                onClick={() => { cat.onCreate?.(query); setQuery(""); }}
              >
                <Plus className="h-3 w-3" />{cat.icon} {cat.name}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
