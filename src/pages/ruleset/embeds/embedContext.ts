import { createContext, useContext } from "react";
import type { RulesetCustomSection } from "../ruleset-editor";

// What this app's own embed nodes (page gallery, image, properties,
// component list — see the sibling files in this folder) need at render
// time. The markdown-live-editor package itself knows nothing about this —
// it's supplied entirely by this app: wrap `<MarkdownLiveEditor>` with
// `<EmbedContextReact.Provider value={...}>` at each call site (see
// ruleset-editor.tsx) and each embed's own NodeView reads it back out via
// `useEmbedContext()`.
export interface EmbedContext {
  rulesetId: string;
  sectionId: string;
  allSections: RulesetCustomSection[];
  onNavigate: (id: string) => void;
  onAddPage: (parentId: string) => RulesetCustomSection;
}

// Tiptap's React node views render as real React portals into the same
// component tree `<EditorContent>` renders in (not an isolated `createRoot`
// off on its own), so plain Context works here even though the Provider
// sits *outside* `<MarkdownLiveEditor>` rather than inside it — each embed
// node view pulls what it needs (rulesetId, sections, navigation) straight
// from this instead of it being threaded through node attrs, which would
// leak into the saved markdown.
export const EmbedContextReact = createContext<EmbedContext | null>(null);
export function useEmbedContext(): EmbedContext {
  const ctx = useContext(EmbedContextReact);
  if (!ctx) throw new Error("useEmbedContext must be used within an EmbedContextReact.Provider");
  return ctx;
}
