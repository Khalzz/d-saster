import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import type { TabPaneSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function TabPaneSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as TabPaneSettings;

  return (
    <>
      <div className="mb-3">
        <Field label="Tab Label">
          <input
            type="text"
            value={s.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Tab name"
            className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
          />
        </Field>
      </div>
      <div className="mb-3">
        <Field label="Direction">
          <div className="flex rounded-md overflow-hidden border border-gold-500/30">
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium border-0! rounded-none! transition-colors ${
                s.direction !== "horizontal"
                  ? "bg-gold-500/20! text-gold-300!"
                  : "bg-transparent! text-gold-600! hover:bg-gold-500/10!"
              }`}
              onClick={() => onChange({ direction: "vertical" })}
            >
              Vertical
            </button>
            <div className="w-px bg-gold-500/30 shrink-0" />
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium border-0! rounded-none! transition-colors ${
                s.direction === "horizontal"
                  ? "bg-gold-500/20! text-gold-300!"
                  : "bg-transparent! text-gold-600! hover:bg-gold-500/10!"
              }`}
              onClick={() => onChange({ direction: "horizontal" })}
            >
              Horizontal
            </button>
          </div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Padding" value={s.padding} onChange={(v) => onChange({ padding: v })} suffix="px" />
        <NumberField label="Gap" value={s.gap} onChange={(v) => onChange({ gap: v })} suffix="px" />
      </div>
    </>
  );
}
