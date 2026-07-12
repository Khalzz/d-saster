import type { ReactNode, MouseEvent } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export function TabBar({
  tabs, activeId, onSelect, emptyMessage, onWrapperClick,
}: {
  tabs: TabItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  onWrapperClick?: (e: MouseEvent) => void;
}) {
  return (
    <div className="flex border-b border-gold-500/20" onClick={onWrapperClick}>
      {tabs.length === 0 && emptyMessage ? (
        <span className="text-gold-700 text-[10px] px-3 py-2 italic">{emptyMessage}</span>
      ) : (
        tabs.map(tab => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors border-y-0 border-x-0 rounded-none border-r border-gold-500/20 last:border-r-0 ${
                active
                  ? "text-gold-300 bg-gold-500/8"
                  : "text-gold-600 hover:text-gold-400 hover:bg-gold-500/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })
      )}
      <div className="flex-1" />
    </div>
  );
}
