import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { fencedJsonMarkdown, embedDomSpec } from "markdown-live-editor";
import { type RulesetCardBlockData, CardBlockComponent } from "../ruleset-editor";
import { useEmbedContext } from "./embedContext";

// See componentListNode.tsx/propertiesNode.tsx for why `contentEditable={false}`
// matters here: CardBlockComponent nests a real editable region of its own
// (its inner MarkdownLiveEditor), and without this the inner editable
// surface sits nested inside the *outer* editor's own contentEditable="true"
// surface (inherited by default) rather than isolated inside a non-editable
// island first — undefined/inconsistent browser behavior.
function CardView({ node, updateAttributes }: NodeViewProps) {
  const ctx = useEmbedContext();
  const data = node.attrs as RulesetCardBlockData;
  return (
    <NodeViewWrapper contentEditable={false}>
      <CardBlockComponent data={data} ctx={ctx} onUpdate={(next) => updateAttributes(next)} />
    </NodeViewWrapper>
  );
}

// A "card" block — see CardBlockComponent in ruleset-editor.tsx for the
// bordered-panel-around-a-nested-editor UI. `atom: true` for the same
// reason as componentList/pageGallery: no ProseMirror-editable text content
// of its own, only attrs (the nested editor's content lives in `content`).
export const CardNode = Node.create({
  name: "card",
  group: "block",
  atom: true,
  selectable: true,
  priority: 200,
  addAttributes() {
    return {
      id: { default: null },
      content: { default: "" },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(CardView);
  },
  ...embedDomSpec("card"),
  ...fencedJsonMarkdown("card", "card"),
});
