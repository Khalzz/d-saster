import type { NodePreviewProps } from "../types";
import { CountNode } from "../../../../../components/ui/character-sheet/nodes/count-node/count-node";
import { EditorPreviewWrapper } from "../EditorPreviewWrapper";
import { useMockSheet } from "../mockSheet";

export function CounterPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  return (
    <EditorPreviewWrapper nodeId={node.id} selectedIds={selectedIds} onSelect={onSelect} className="w-fit">
      <CountNode node={node} useSheet={useMockSheet} />
    </EditorPreviewWrapper>
  );
}
