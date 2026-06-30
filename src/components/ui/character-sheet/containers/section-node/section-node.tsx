import { CircleHelp } from "lucide-react";
import { InteractiveNode, SheetContext } from "../../../../../pages/character/components/CharacterSheetView"
import { LayoutNode, SectionSettings } from "../../../../../pages/sheet-editor/types";
import { resolveHandlebars } from "../../../../../pages/sheet-editor/handlebars";
import Tooltip from "../../../tooltip/Tooltip";

// ── Section ────────────────────────────────────────────────────────────────
export function SectionNode({ node, useSheet }: { node: LayoutNode, useSheet: () => SheetContext }) {
  const { title, padding, gap, width, description, direction = "column" } = node.settings as SectionSettings;
  const { vars } = useSheet();
  const resolvedDescription = description ? resolveHandlebars(description, vars) : "";
  return (
    <div
      className="relative rounded-md border border-gold-500/30"
      style={{ padding, height: "fit-content", maxHeight: "fit-content", ...(width > 0 ? { width: `${width}%`, flexShrink: 0 } : { flex: "1 1 0%", minWidth: 0 }) }}
    >
      <span className="absolute top-0 left-3 h-2 flex items-center -translate-y-1/2 px-1.5 bg-surface text-[10px] font-semibold uppercase tracking-widest text-gold-500/50 select-none gap-1">
        {title || "Section"}
        {resolvedDescription && (
          <Tooltip text={resolvedDescription}>
            <CircleHelp className="h-3 w-3 text-gold-600 hover:text-gold-400 transition-colors" />
          </Tooltip>
        )}
      </span>
      <div className={`flex ${direction === "row" ? "flex-row flex-wrap" : "flex-col"}`} style={{ gap }}>
        {node.children.map((child) => (
          <InteractiveNode key={child.id} node={child} />
        ))}
      </div>
    </div>
  );
}