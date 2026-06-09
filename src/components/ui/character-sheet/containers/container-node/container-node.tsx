import { InteractiveNode } from "../../../../../pages/character/components/CharacterSheetView";
import { ContainerSettings } from "../../../../../pages/sheet-editor/types";
import { LayoutNode } from "../../../../../pages/sheet-editor/types";

export function ContainerNode({ node }: { node: LayoutNode }) {
  const s = node.settings as ContainerSettings;
  const { padding, gap, direction } = s;
  const flexStyle: React.CSSProperties =
    s.width > 0
      ? { flex: `0 0 ${s.width}%`, maxWidth: `${s.width}%` }
      : { flex: "1 1 0%", minWidth: 0 };

  return (
    <div
      style={{
        ...flexStyle,
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        padding,
        gap,
      }}
    >
      {node.children.map((child) => (
        <InteractiveNode key={child.id} node={child} />
      ))}
    </div>
  );
}