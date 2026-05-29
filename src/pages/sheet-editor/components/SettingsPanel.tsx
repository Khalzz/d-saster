import Field from "../../../components/ui/Field";
import type {
  LayoutNode,
  SectionSettings,
  RowSettings,
  ColumnSettings,
} from "../types";

// ── Reusable number field ──────────────────────────────────────────────────
function NumberField({
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
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value);
            if (!isNaN(n)) onChange(Math.max(min, max !== undefined ? Math.min(n, max) : n));
          }}
          className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
        />
        {suffix && (
          <span className="text-gold-700 text-[10px] shrink-0">{suffix}</span>
        )}
      </div>
    </Field>
  );
}

// ── Section settings ───────────────────────────────────────────────────────
function SectionSettingsPanel({
  settings,
  onChange,
}: {
  settings: SectionSettings;
  onChange: (patch: Partial<SectionSettings>) => void;
}) {
  return (
    <>
      <Field label="Title">
        <input
          type="text"
          value={settings.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Section title"
          className="bg-base border border-gold-500/30 rounded-md px-2 py-1.5 text-xs text-gold-500 w-full caret-gold-500 focus:ring-0 focus:border-gold-500! outline-none"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <NumberField
          label="Padding"
          value={settings.padding}
          onChange={(v) => onChange({ padding: v })}
          suffix="px"
        />
        <NumberField
          label="Gap"
          value={settings.gap}
          onChange={(v) => onChange({ gap: v })}
          suffix="px"
        />
      </div>
    </>
  );
}

// ── Row settings ───────────────────────────────────────────────────────────
function RowSettingsPanel({
  settings,
  onChange,
}: {
  settings: RowSettings;
  onChange: (patch: Partial<RowSettings>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <NumberField
        label="Padding"
        value={settings.padding}
        onChange={(v) => onChange({ padding: v })}
        suffix="px"
      />
      <NumberField
        label="Gap"
        value={settings.gap}
        onChange={(v) => onChange({ gap: v })}
        suffix="px"
      />
    </div>
  );
}

// ── Column settings ────────────────────────────────────────────────────────
function ColumnSettingsPanel({
  settings,
  onChange,
}: {
  settings: ColumnSettings;
  onChange: (patch: Partial<ColumnSettings>) => void;
}) {
  return (
    <>
      <NumberField
        label="Width"
        value={settings.width}
        onChange={(v) => onChange({ width: v })}
        min={0}
        max={100}
        suffix="% (0 = auto)"
      />
      <div className="grid grid-cols-2 gap-3 mt-3">
        <NumberField
          label="Padding"
          value={settings.padding}
          onChange={(v) => onChange({ padding: v })}
          suffix="px"
        />
        <NumberField
          label="Gap"
          value={settings.gap}
          onChange={(v) => onChange({ gap: v })}
          suffix="px"
        />
      </div>
    </>
  );
}

// ── Main exported component ────────────────────────────────────────────────
interface SettingsPanelProps {
  node: LayoutNode | null;
  onChange: (patch: Record<string, unknown>) => void;
}

const TYPE_LABELS: Record<string, string> = {
  section: "Section",
  row: "Row",
  column: "Column",
};

export function SettingsPanel({ node, onChange }: SettingsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gold-500/20 shrink-0">
        <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">
          {node ? `${TYPE_LABELS[node.type]} Settings` : "Settings"}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {!node ? (
          <p className="text-gold-700 text-[10px] text-center py-6 select-none">
            Select an element to edit its settings
          </p>
        ) : node.type === "section" ? (
          <SectionSettingsPanel
            settings={node.settings as SectionSettings}
            onChange={onChange}
          />
        ) : node.type === "row" ? (
          <RowSettingsPanel
            settings={node.settings as RowSettings}
            onChange={onChange}
          />
        ) : (
          <ColumnSettingsPanel
            settings={node.settings as ColumnSettings}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
}
