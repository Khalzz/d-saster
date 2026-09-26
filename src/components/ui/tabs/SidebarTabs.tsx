import { useState } from "react";
import type { TabDefinition } from "./Tabs";
import { SidebarTabBar } from "./SidebarTabBar";

export function SidebarTabs({ tabs, defaultActiveId, className }: {
  tabs: TabDefinition[];
  defaultActiveId?: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState(defaultActiveId ?? tabs[0]?.id ?? "");
  const active = tabs.find(t => t.id === activeId) ?? tabs[0];

  return (
    <div className={`flex flex-row ${className ?? ""}`}>
      <SidebarTabBar tabs={tabs} activeId={active?.id ?? null} onSelect={setActiveId} />
      <div className="flex-1 min-h-0 min-w-0">
        {active?.content}
      </div>
    </div>
  );
}
