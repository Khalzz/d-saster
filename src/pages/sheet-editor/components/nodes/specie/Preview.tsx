import type { NodePreviewProps } from "../types";
import { SpecieNode } from "../../../../../components/ui/character-sheet/nodes/specie-node/specie-node";
import { EditorPreviewWrapper } from "../EditorPreviewWrapper";
import { useMockSheet } from "../mockSheet";

export function SpeciePreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  return (
    <EditorPreviewWrapper nodeId={node.id} selectedIds={selectedIds} onSelect={onSelect}>
      <SpecieNode node={node} useSheet={useMockSheet} />
    </EditorPreviewWrapper>
  );
}
