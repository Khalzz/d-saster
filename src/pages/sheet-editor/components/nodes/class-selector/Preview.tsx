import type { NodePreviewProps } from "../types";
import { ClassSelectorNode } from "../../../../../components/ui/character-sheet/nodes/class-selector/class-selector";
import { EditorPreviewWrapper } from "../EditorPreviewWrapper";
import { useMockSheet } from "../mockSheet";

export function ClassSelectorPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  return (
    <EditorPreviewWrapper nodeId={node.id} selectedIds={selectedIds} onSelect={onSelect}>
      <ClassSelectorNode node={node} useSheet={useMockSheet} />
    </EditorPreviewWrapper>
  );
}
