import { Plus, Trash2 } from "lucide-react";
import type { TabsSettings, TabPaneSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function TabsSettingsForm({ settings, onChange, node, onAddChild, onRemoveChild, onUpdateChild }: NodeSettingsProps) {
  const s = settings as unknown as TabsSettings;
  const panes = node?.children ?? [];

  return (
    <>
      <div className="mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-600">Width</span>
        <div className="mt-1 relative">
          <input
            type="text"
            inputMode="numeric"
            value={s.width ? String(s.width) : ""}
            onChange={(e) => {
              const v = e.target.value === "" ? 0 : Math.min(100, Math.max(0, Number(e.target.value) || 0));
              onChange({ width: v });
            }}
            placeholder="Auto"
            className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gold-700 pointer-events-none">%</span>
        </div>
      </div>

      <div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-600">Tabs</span>
        <div className="mt-2 flex flex-col gap-1.5">
          {panes.map((pane) => {
            const ps = pane.settings as TabPaneSettings;
            return (
              <div key={pane.id} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={ps.label ?? ""}
                  onChange={(e) => onUpdateChild?.(pane.id, { label: e.target.value })}
                  placeholder="Tab name"
                  className="flex-1 bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
                />
                <button
                  type="button"
                  onClick={() => onRemoveChild?.(pane.id)}
                  disabled={panes.length <= 1}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gold-700 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onAddChild?.("tab-pane")}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-dashed border-gold-500/30 text-gold-600 hover:text-gold-400 hover:border-gold-500/50 transition-colors text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Add Tab
        </button>
      </div>
    </>
  );
}
