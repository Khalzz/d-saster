import type { NodePreviewProps } from "../types";
import { FeaturesAndTraitsNode } from "../../../../../components/ui/character-sheet/nodes/features-and-traits/features-and-traits";
import { EditorPreviewWrapper } from "../EditorPreviewWrapper";
import { useMockSheet } from "../mockSheet";

export function FeaturesAndTraitsPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  return (
    <EditorPreviewWrapper nodeId={node.id} selectedIds={selectedIds} onSelect={onSelect}>
      <FeaturesAndTraitsNode node={node} useSheet={useMockSheet} />
    </EditorPreviewWrapper>
  );
}
