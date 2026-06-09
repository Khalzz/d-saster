import type { NodePreviewProps } from "../types";
import { ProficiencyBonusNode } from "../../../../../components/ui/character-sheet/nodes/proficiency-node/proficiency-node";
import { EditorPreviewWrapper } from "../EditorPreviewWrapper";
import { useMockSheet } from "../mockSheet";

export function ProficiencyBonusPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  return (
    <EditorPreviewWrapper nodeId={node.id} selectedIds={selectedIds} onSelect={onSelect}>
      <ProficiencyBonusNode node={node} useSheet={useMockSheet} />
    </EditorPreviewWrapper>
  );
}
