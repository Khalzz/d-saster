import type { LayoutNode, NodeTypeConfig } from "../types";

interface SettingsPanelProps {
  node: LayoutNode | null;
  selectedCount: number;
  onChange: (patch: Record<string, unknown>) => void;
  nodeTypes: Record<string, NodeTypeConfig>;
}

export function SettingsPanel({ node, selectedCount, onChange, nodeTypes }: SettingsPanelProps) {
  const config = node ? nodeTypes[node.type] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gold-500/20 shrink-0">
        <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">
          {selectedCount > 1
            ? "Selection"
            : config
              ? `${config.label} Settings`
              : "Settings"}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {selectedCount > 1 ? (
          <p className="text-gold-500 text-xs text-center py-6 select-none">
            {selectedCount} elements selected
          </p>
        ) : !node || !config ? (
          <p className="text-gold-700 text-[10px] text-center py-6 select-none">
            Select an element to edit its settings
          </p>
        ) : (
          <config.Settings
            settings={node.settings as unknown as Record<string, unknown>}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
}
