import { useState, type ReactNode } from "react";
import { TabBar, type TabItem } from "./TabBar";

export interface TabDefinition extends TabItem {
  content: ReactNode;
}

export function Tabs({ tabs, defaultActiveId, className }: {
  tabs: TabDefinition[];
  defaultActiveId?: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState(defaultActiveId ?? tabs[0]?.id ?? "");
  const active = tabs.find(t => t.id === activeId) ?? tabs[0];

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <TabBar tabs={tabs} activeId={active?.id ?? null} onSelect={setActiveId} />
      <div className="flex-1 min-h-0">
        {active?.content}
      </div>
    </div>
  );
}
