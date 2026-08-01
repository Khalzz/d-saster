import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { fencedJsonMarkdown, embedDomSpec } from "markdown-live-editor";
import { type RulesetImageBlockData, ImageBlockComponent, deleteRulesetImageFile } from "../ruleset-editor";
import { useEmbedContext } from "./embedContext";

// See propertiesNode.tsx for why the root here is `NodeViewWrapper` rather
// than a plain element — it's what carries the `data-node-view-wrapper`
// marker ProseMirror's NodeView contract expects, and it adds no styling of
// its own, so ImageBlockComponent's own float/alignment behavior is
// unaffected.
function ImageBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const ctx = useEmbedContext();
  const data = node.attrs as RulesetImageBlockData;
  return (
    <NodeViewWrapper>
      <ImageBlockComponent
        data={data}
        rulesetId={ctx.rulesetId}
        onUpdate={(next) => updateAttributes(next)}
        onRemove={() => {
          deleteNode();
          if (data.src) deleteRulesetImageFile(ctx.rulesetId, data.src);
        }}
      />
    </NodeViewWrapper>
  );
}

export const ImageBlockNode = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,
  selectable: true,
  priority: 200,
  addAttributes() {
    return {
      id: { default: null },
      src: { default: "" },
      align: { default: "full" },
      width: { default: 320 },
      height: { default: 200 },
      lockAspect: { default: true },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
  ...embedDomSpec("imageBlock"),
  ...fencedJsonMarkdown("image", "imageBlock"),
});
