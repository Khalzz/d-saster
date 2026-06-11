import type { SheetContext } from "../../../../../pages/character/components/CharacterSheetView";
import type { StaticCounterSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";
import { evalFormula } from "../../../../../pages/sheet-editor/handlebars";
import { StaticCounterBox } from "../count-node/static-counter-box";

export function StaticCounterNode({ node, useSheet }: { node: LayoutNode; useSheet: () => SheetContext }) {
  const s = node.settings as StaticCounterSettings;
  const { vars } = useSheet();
  const direction = s.direction ?? "vertical";

  const raw = s.value ? evalFormula(s.value, vars) : "";
  const resolved = (() => {
    if (!raw || !s.showSign) return raw;
    const n = Number(raw);
    if (isNaN(n) || raw.trim() === "") return raw;
    return n > 0 ? `+${raw}` : raw;
  })();

  return (
    <StaticCounterBox
      label={s.label || "Label"}
      direction={direction}
      shieldView={s.shieldView}
      width={s.width}
      height={s.height}
      padding={s.padding}
    >
      <span className={direction === "horizontal"
        ? "text-sm font-bold text-gold-300"
        : "text-xl font-light leading-tight text-gold-300 text-center mb-2"
      }>
        {resolved || "—"}
      </span>
    </StaticCounterBox>
  );
}
