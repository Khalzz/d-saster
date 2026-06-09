import Field from "../../../../components/ui/Field";
import { NumberInput } from "../../../../components/ui/NumberInput";

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
  return (
    <Field label={label}>
      <NumberInput value={value} onChange={onChange} min={min} max={max} suffix={suffix} />
    </Field>
  );
}
