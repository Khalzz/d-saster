import { useState } from "react";
import Field from "../../../../../components/ui/Field";
import { NumberField } from "../shared";
import type { ContainerSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

export function ContainerSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as ContainerSettings;
  const [widthRaw, setWidthRaw] = useState<string>(s.width > 0 ? String(s.width) : "");

  return (
    <>
      <div className="mb-3">
        <Field label="Name">
          <input
            type="text"
            value={s.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Container"
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
                s.direction === "horizontal"
                  ? "bg-gold-500/20! text-gold-300!"
                  : "bg-transparent! text-gold-600! hover:bg-gold-500/10!"
              }`}
              onClick={() => onChange({ direction: "horizontal" })}
            >
              Horizontal
            </button>
            <div className="w-px bg-gold-500/30 shrink-0" />
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium border-0! rounded-none! transition-colors ${
                s.direction === "vertical"
                  ? "bg-gold-500/20! text-gold-300!"
                  : "bg-transparent! text-gold-600! hover:bg-gold-500/10!"
              }`}
              onClick={() => onChange({ direction: "vertical" })}
            >
              Vertical
            </button>
          </div>
        </Field>
      </div>
      <Field label="Width">
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={widthRaw}
            placeholder="Full"
            onChange={(e) => {
              const text = e.target.value;
              if (text === "") {
                setWidthRaw("");
                onChange({ width: 0 });
                return;
              }
              const n = parseInt(text);
              if (!isNaN(n) && n >= 0) {
                setWidthRaw(text);
                onChange({ width: Math.min(n, 100) });
              }
            }}
            onBlur={() => {
              if (widthRaw === "") return;
              const n = parseInt(widthRaw);
              if (isNaN(n) || n <= 0) {
                setWidthRaw("");
                onChange({ width: 0 });
              }
            }}
            className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gold-700 pointer-events-none">%</span>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <NumberField
          label="Padding"
          value={s.padding}
          onChange={(v) => onChange({ padding: v })}
          suffix="px"
        />
        <NumberField
          label="Gap"
          value={s.gap}
          onChange={(v) => onChange({ gap: v })}
          suffix="px"
        />
      </div>
    </>
  );
}
