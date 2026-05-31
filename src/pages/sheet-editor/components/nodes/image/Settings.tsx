import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { NumberField } from "../shared";
import Tooltip from "../../../../../components/ui/tooltip/Tooltip";
import Field from "../../../../../components/ui/Field";
import type { ImageSettings } from "../../../types";
import type { NodeSettingsProps } from "../types";

function SizeInput({
  label,
  value,
  onChange,
  max,
  tooltip,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  tooltip: string;
  placeholder?: string;
}) {
  const [raw, setRaw] = useState<string>(value > 0 ? String(value) : "");

  // Sync external value changes
  const expected = value > 0 ? String(value) : "";
  if (raw !== "" && raw !== expected && Number(raw) === value) {
    // no-op
  } else if (raw !== "" && Number(raw) !== value && value > 0) {
    setRaw(String(value));
  } else if (raw !== "" && value === 0) {
    // external reset
  }

  return (
    <Field label={
      <span className="flex items-center gap-1">
        {label}
        <Tooltip text={tooltip}>
          <CircleHelp className="h-3 w-3 text-gold-700 hover:text-gold-500 cursor-help" />
        </Tooltip>
      </span>
    }>
      <input
        type="text"
        value={raw}
        placeholder={placeholder ?? "Full"}
        onChange={(e) => {
          const text = e.target.value;
          if (text === "") {
            setRaw("");
            onChange(0);
            return;
          }
          const n = parseInt(text);
          if (!isNaN(n) && n >= 0) {
            setRaw(text);
            onChange(max !== undefined ? Math.min(n, max) : n);
          }
        }}
        onBlur={() => {
          if (raw === "") {
            onChange(0);
          }
        }}
        className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none placeholder:text-gold-700 placeholder:italic"
      />
    </Field>
  );
}

export function ImageSettingsForm({ settings, onChange }: NodeSettingsProps) {
  const s = settings as unknown as ImageSettings;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Width"
          value={s.width}
          onChange={(v) => onChange({ width: v })}
          max={100}
          placeholder={s.squared ? "Auto" : "None"}
          tooltip={s.squared ? "Value in %. Leave empty to derive width from height via aspect-ratio." : "Value in %. Leave empty to not set a width."}
        />
        <SizeInput
          label="Height"
          value={s.height}
          onChange={(v) => onChange({ height: v })}
          max={100}
          placeholder={s.squared ? "Auto" : "None"}
          tooltip={s.squared ? "Value in %. Leave empty to derive height from width via aspect-ratio." : "Value in %. Leave empty to not set a height."}
        />
      </div>

      {/* Squared toggle */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gold-500">Squared (1:1)</span>
        <button
          type="button"
          className={`relative w-7! min-w-0! h-4! rounded-full! border-0! p-0! transition-colors cursor-pointer ${s.squared ? "bg-gold-500!" : "bg-gold-500/20!"}`}
          onClick={() => onChange({ squared: !s.squared })}
        >
          <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${s.squared ? "left-3.5 bg-base" : "left-0.5 bg-gold-700"}`} />
        </button>
      </div>

      <div className="mt-3">
        <NumberField
          label="Padding"
          value={s.padding}
          onChange={(v) => onChange({ padding: v })}
          suffix="px"
        />
      </div>
    </>
  );
}
