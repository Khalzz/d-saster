import type { TabItem } from "./TabBar";

export function SidebarTabBar({
  tabs, activeId, onSelect,
}: {
  tabs: TabItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-1.5 border-r border-gold-500/20 bg-surface/20 shrink-0">
      {tabs.map(tab => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`group relative flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
              active ? "text-gold-300 bg-gold-500/10" : "text-gold-600 hover:text-gold-400 hover:bg-gold-500/5"
            }`}
          >
            {tab.icon}
            <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-gold-500/30 bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-300 opacity-0 shadow-lg transition-opacity z-20 group-hover:opacity-100">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
