import { InteractiveNode } from "../../../../../pages/character/components/CharacterSheetView";
import { GridSettings, LayoutNode } from "../../../../../pages/sheet-editor/types";


export function GridNode({ node }: { node: LayoutNode }) {
  const { columns, padding, gap } = node.settings as GridSettings;
  return (
    <div
      className="grid w-full"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, padding, gap }}
    >
      {node.children.map((child) => (
        <InteractiveNode key={child.id} node={child} />
      ))}
    </div>
  );
}