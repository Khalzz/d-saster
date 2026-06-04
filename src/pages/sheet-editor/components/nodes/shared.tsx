import { useEffect, useState } from "react";
import Field from "../../../../components/ui/Field";

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const safeValue = typeof value === "number" && !isNaN(value) ? value : min;
  const [raw, setRaw] = useState<string>(String(safeValue));

  useEffect(() => {
    setRaw(String(typeof value === "number" && !isNaN(value) ? value : min));
  }, [value, min]);

  return (
    <Field label={label}>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          value={raw}
          onChange={(e) => {
            const text = e.target.value;
            setRaw(text);
            if (text === "") return;
            const n = parseInt(text);
            if (!isNaN(n)) onChange(Math.max(min, max !== undefined ? Math.min(n, max) : n));
          }}
          onBlur={() => {
            if (raw === "" || isNaN(Number(raw))) {
              setRaw(String(min));
              onChange(min);
            }
          }}
          className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gold-700 pointer-events-none">{suffix}</span>
        )}
      </div>
    </Field>
  );
}
