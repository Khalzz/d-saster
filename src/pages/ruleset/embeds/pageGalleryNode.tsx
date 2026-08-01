import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { fencedJsonMarkdown, embedDomSpec } from "markdown-live-editor";
import { type RulesetPageContainerData, PageContainerBlock } from "../ruleset-editor";
import { useEmbedContext } from "./embedContext";

// See propertiesNode.tsx for why the root here is `NodeViewWrapper` rather
// than a plain element — it's what carries the `data-node-view-wrapper`
// marker ProseMirror's NodeView contract expects, and it adds no styling of
// its own, so PageContainerBlock's own look comes through unchanged.
function PageGalleryView({ node, updateAttributes }: NodeViewProps) {
  const ctx = useEmbedContext();
  const data = node.attrs as RulesetPageContainerData;
  return (
    <NodeViewWrapper>
      <PageContainerBlock
        data={data}
        rulesetId={ctx.rulesetId}
        allSections={ctx.allSections}
        onNavigate={ctx.onNavigate}
        onUpdate={(next) => updateAttributes(next)}
        onAddPage={() => {
          const page = ctx.onAddPage(ctx.sectionId);
          updateAttributes({ items: [...data.items, { pageId: page.id }] });
        }}
      />
    </NodeViewWrapper>
  );
}

// A "page gallery" block — see PageContainerBlock in ruleset-editor.tsx for
// the actual card grid/row/column UI, reused here unmodified via a
// NodeView. `atom: true` keeps it a single opaque unit (no cursor entering
// its "content" — it doesn't have any ProseMirror-editable text content of
// its own, only attrs).
export const PageGalleryNode = Node.create({
  name: "pageGallery",
  group: "block",
  atom: true,
  selectable: true,
  priority: 200,
  addAttributes() {
    return {
      id: { default: null },
      layout: { default: "col" },
      items: { default: [] },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(PageGalleryView);
  },
  ...embedDomSpec("pageGallery"),
  ...fencedJsonMarkdown("pages", "pageGallery"),
});
