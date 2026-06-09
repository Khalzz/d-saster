import type { NodePreviewProps } from "../types";
import { TextInputNode } from "../../../../../components/ui/character-sheet/nodes/text-input-node/text-input-node";
import { EditorPreviewWrapper } from "../EditorPreviewWrapper";
import { useMockSheet } from "../mockSheet";

export function TextInputPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  return (
    <EditorPreviewWrapper nodeId={node.id} selectedIds={selectedIds} onSelect={onSelect}>
      <TextInputNode node={node} useSheet={useMockSheet} />
    </EditorPreviewWrapper>
  );
}
