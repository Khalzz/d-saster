import type { MarkdownLiveTheme } from "markdown-live-editor";

// A `MarkdownLiveTheme` matching this app's own gold palette (App.css's
// `--color-gold-*`/`--color-surface` tokens — already defined there, so
// nothing extra needs adding for these classes to resolve), built the same
// way the package's own built-in themes are (see its zinc.ts/mauve.ts) —
// one shared shape covering markdown content, the floating menus, the drag
// handle/ghost, the selection ring, and the color pickers. Colors mirror
// MARKDOWN_STYLES (components/ui/Markdown.tsx) — the app's one existing
// source of truth for "what gold markdown looks like" — so the live editor
// reads the same as every other markdown surface in the app. No `dark:`
// variants: this app has a single always-dark look, not a toggleable one.
export const GOLD_THEME: MarkdownLiveTheme = {
  markdown: {
    content: "outline-none text-sm leading-relaxed py-6 [&>*]:rounded-md [&>*]:transition-[box-shadow,background-color,padding] [&>*]:duration-200 text-gold-400 caret-gold-500 selection:bg-gold-500/20",
    p: "mb-4 last:mb-0 text-sm font-light leading-relaxed pl-[var(--select-pad,0px)]",
    strong: "text-sm font-semibold text-gold-300",
    em: "italic text-gold-600",
    h1: "text-gold-500 text-2xl font-bold leading-tight mb-2 pl-[var(--select-pad,0px)]",
    h2: "text-gold-400 text-lg leading-tight font-semibold mb-1 mt-6 pl-[var(--select-pad,0px)]",
    h3: "text-gold-400 font-bold mt-6 pl-[var(--select-pad,0px)]",
    hr: "border-0 h-px bg-gold-500/20 mb-3 mt-2",
    code: "rounded bg-gold-500/10 text-xs font-light px-1 py-0.5 font-mono text-gold-400",
    blockquote: "border-l-2 border-gold-500/40 pl-[calc(0.75rem+var(--select-pad,0px))] italic text-gold-500 text-sm mb-4 last:mb-0",
    ul: "list-disc pl-[calc(1.5rem+var(--select-pad,0px))] flex flex-col last:pb-0 mb-4 text-sm",
    ol: "list-decimal pl-[calc(3rem+var(--select-pad,0px))] flex flex-col mb-2 last:mb-0",
    li: "leading-snug last:mb-0 text-sm text-gold-500/80 [&>p]:[--select-pad:0px]",
    table: "w-full border-collapse text-sm pl-[var(--select-pad,0px)]",
    tr: "border-b border-gold-500/10 last:border-0",
    th: "text-left px-2 py-1.5 text-gold-400 font-semibold",
    td: "px-2 py-1.5 align-top text-gold-300",
  },
  menu: {
    background: "bg-surface",
    border: "border-gold-500/30",
    text: "text-gold-500",
    button: "bg-transparent! text-gold-500! hover:bg-gold-500/10! hover:text-gold-300!",
    buttonActive: "border-gold-500/40! bg-gold-500/15! text-gold-300!",
    separator: "bg-gold-500/20",
    activeRing: "border-gold-500! ring-1! ring-gold-500!",
  },
  handle: "text-gold-600 hover:text-gold-400",
  ghost: "bg-surface text-gold-400",
  blockSelection: "[--select-pad:0.5rem] bg-gold-500/10",
  textColors: [
    "#a8872d", // gold-600
    "#f87171", // red-400
    "#fb923c", // orange-400
    "#fbbf24", // amber-400
    "#4ade80", // green-400
    "#60a5fa", // blue-400
    "#c084fc", // purple-400
    "#f472b6", // pink-400
  ],
  highlightColors: [
    "#f9efce", // gold-100
    "#7f1d1d", // red-900
    "#7c2d12", // orange-900
    "#78350f", // amber-900
    "#14532d", // green-900
    "#1e3a8a", // blue-900
    "#4c1d95", // purple-900
    "#831843", // pink-900
  ],
  swatch: "#c8a84b", // gold-500
};
