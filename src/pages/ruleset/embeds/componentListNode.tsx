import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { fencedJsonMarkdown, embedDomSpec } from "markdown-live-editor";
import { type RulesetComponentListData, ComponentListBlock } from "../ruleset-editor";
import { useEmbedContext } from "./embedContext";

// Mirrors pageGalleryNode.tsx's structure, but — like propertiesNode.tsx —
// needs `contentEditable={false}` on the wrapper: this node view nests real
// editable regions of its own (the identifier input, and each card's own
// nested MarkdownLiveEditor), and without this they sit as a plain
// contentEditable="true" island directly inside the *outer* editor's own
// contentEditable="true" surface (inherited by default) rather than isolated
// inside a non-editable one first — undefined/inconsistent browser
// behavior. Kept as a fully separate node/component pair (not a variant of
// pageGallery/PageContainerBlock) so that one keeps working unmodified for
// any document already using it.
function ComponentListView({ node, updateAttributes, selected }: NodeViewProps) {
  const ctx = useEmbedContext();
  const data = node.attrs as RulesetComponentListData;
  return (
    <NodeViewWrapper contentEditable={false}>
      <ComponentListBlock
        data={data}
        ctx={ctx}
        selected={selected}
        onUpdate={(next) => updateAttributes(next)}
        onAddPageCard={() => {
          const page = ctx.onAddPage(ctx.sectionId);
          updateAttributes({ items: [...data.items, { id: crypto.randomUUID(), kind: "page", pageId: page.id }] });
        }}
      />
    </NodeViewWrapper>
  );
}

// A "component list" block — see ComponentListBlock in ruleset-editor.tsx
// for the card column/grid UI. `atom: true` for the same reason as
// pageGallery: no ProseMirror-editable text content of its own, only attrs.
export const ComponentListNode = Node.create({
  name: "componentList",
  group: "block",
  atom: true,
  selectable: true,
  priority: 200,
  addAttributes() {
    return {
      id: { default: null },
      name: { default: null },
      layout: { default: "col" },
      columns: { default: 3 },
      items: { default: [] },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ComponentListView);
  },
  ...embedDomSpec("componentList"),
  ...fencedJsonMarkdown("components", "componentList"),
});
