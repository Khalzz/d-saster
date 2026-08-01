import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { fencedJsonMarkdown, embedDomSpec } from "markdown-live-editor";
import { type RulesetPropertiesBlockData, PropertiesBlockComponent } from "../ruleset-editor";
import { PropertyValueEditor } from "./PropertyValueEditor";

// Tiptap requires a NodeView's root to be a `NodeViewWrapper` (it's what
// carries the `data-node-view-wrapper` marker ProseMirror's NodeView
// contract checks for) — skipping it doesn't just risk a runtime warning,
// it also leaves Tiptap's own auto-generated wrapper div as the *only*
// thing marked that way, so the actual component renders as an extra,
// unstyled nested div inside it. `NodeViewWrapper` itself adds no visual
// styling of its own, so PropertiesBlockComponent's deliberately
// card-less look (matching how it renders elsewhere in the app) comes
// through unchanged.
function PropertiesView({ node, updateAttributes }: NodeViewProps) {
  const data = node.attrs as RulesetPropertiesBlockData;
  return (
    // `contentEditable={false}` here matters specifically because this
    // node view nests its *own* contentEditable region inside it
    // (PropertyValueEditor's mini Tiptap instance) — without this, that
    // inner editable region sits nested inside the *outer* editor's own
    // contentEditable="true" surface (inherited by default), rather than
    // isolated inside a non-editable island. Nested contentEditable is
    // undefined/inconsistent browser behavior, and it was silently
    // breaking the inner editor's input rules (bold/italic/code
    // auto-formatting) specifically, even though basic typing still
    // limped along.
    <NodeViewWrapper contentEditable={false}>
      <PropertiesBlockComponent
        data={data}
        editable
        onUpdate={(next) => updateAttributes(next)}
        renderValueInput={(row, onChange) => <PropertyValueEditor value={row.value} onChange={onChange} />}
      />
    </NodeViewWrapper>
  );
}

export const PropertiesNode = Node.create({
  name: "properties",
  group: "block",
  atom: true,
  selectable: true,
  priority: 200,
  addAttributes() {
    return {
      id: { default: null },
      rows: { default: [] },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(PropertiesView);
  },
  ...embedDomSpec("properties"),
  ...fencedJsonMarkdown("props", "properties"),
});
