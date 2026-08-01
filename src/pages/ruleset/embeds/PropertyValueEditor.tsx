import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { LiveInlineFormatting } from "markdown-live-editor";
import { MARKDOWN_STYLES } from "../../../components/ui/Markdown";

// A properties row's value, edited live as real inline markdown — **bold**,
// *italic*, and `code` render formatted as you type instead of showing raw
// syntax until you stop editing (which is what the shared, framework-
// agnostic PropertiesBlockComponent's default plain-text input does; see
// its `renderValueInput` prop). This is a genuinely separate, nested Tiptap
// editor instance — StarterKit trimmed down to just the inline marks a
// single table-cell value needs, no block structure at all, since there's
// nowhere for a heading or a list to go here.
export function PropertyValueEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  // What this editor itself last emitted via `onChange` — the sync effect
  // below compares the incoming `value` prop against *this*, not against a
  // fresh `editor.getMarkdown()` call. Comparing against a fresh call was
  // the actual bug: markdown serialization backslash-escapes a stray `*`
  // typed before its closing `**` completes the bold pattern, so the
  // string that comes back doesn't necessarily match byte-for-byte on
  // every keystroke — and any mismatch made the effect call `setContent`,
  // replacing the editor's own document (and cursor) on every keystroke,
  // which never gave the input rule a continuous, uninterrupted sequence
  // of typing to actually match against.
  const lastEmittedRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        horizontalRule: false,
        codeBlock: false,
        hardBreak: false,
        link: false,
        strike: false,
        underline: false,
        dropcursor: false,
        gapcursor: false,
        trailingNode: false,
        undoRedo: false,
        paragraph: { HTMLAttributes: { class: "m-0" } },
        bold: { HTMLAttributes: { class: MARKDOWN_STYLES.strong } },
        italic: { HTMLAttributes: { class: MARKDOWN_STYLES.em } },
        code: { HTMLAttributes: { class: MARKDOWN_STYLES.code } },
      }),
      Markdown,
      LiveInlineFormatting,
    ],
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "outline-none text-gold-600 text-xs",
      },
      // A properties value is a single line, not a document — Enter
      // shouldn't split it into a second paragraph.
      handleKeyDown: (_view, event) => event.key === "Enter",
    },
    onUpdate: ({ editor: view }) => {
      const markdown = view.getMarkdown();
      lastEmittedRef.current = markdown;
      onChange(markdown);
    },
  });

  // `value` can change from outside (e.g. the block's own attrs updating
  // via a document-level undo/redo, or the seed data on first mount) —
  // keep the nested editor in sync with that, but never in response to its
  // own typing (see `lastEmittedRef`'s own comment above for why comparing
  // against a fresh `editor.getMarkdown()` call instead was the bug).
  useEffect(() => {
    if (editor && value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      editor.commands.setContent(value, { contentType: "markdown" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  return (
    // Stops the keydown here before it can bubble up into the *outer*
    // editor's own document-level shortcuts — most importantly
    // Delete/Backspace (blockSelection.ts), which would otherwise delete
    // this whole properties block out from under you while you're just
    // trying to backspace a character in its value field, if the block
    // happened to still be node-selected from clicking its drag handle.
    <div className="relative flex-1 min-w-0" onKeyDown={(event) => event.stopPropagation()}>
      {!value && (
        <span className="absolute inset-0 text-gold-700 italic text-xs pointer-events-none">Value</span>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
