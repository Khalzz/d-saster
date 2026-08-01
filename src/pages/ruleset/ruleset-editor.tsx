import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  AlignJustify, AlignLeft, AlignRight, BarChart3, Blocks, ChevronLeft, ChevronRight, Columns3, CreditCard, Files,
  Image, ImagePlus, Layers, LayoutGrid, Lock, NotebookText, Pencil,
  Plus, Rows3, ScrollText, Settings2, Sparkles, Star, Table2, Trash2, Unlock, Users, X, type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { GeneralSection } from "../../components/ui/ruleset/sections/general/general";
import { StatsSection } from "../../components/ui/ruleset/sections/stats/stats";
import { SkillsSection } from "../../components/ui/ruleset/sections/skills/skills";
import { ClassesSection } from "../../components/ui/ruleset/sections/classes/classes";
import SpeciesSection from "../../components/ui/ruleset/sections/species/species";
import { TraitsSection } from "../../components/ui/ruleset/sections/traits/traits";
import { RulesSection } from "../../components/ui/ruleset/sections/rules/rules";
import { Markdown } from "../../components/ui/Markdown";
import { MarkdownLiveEditor, type SlashGroup } from "markdown-live-editor";
import { EmbedContextReact, type EmbedContext } from "./embeds/embedContext";
import { PageGalleryNode } from "./embeds/pageGalleryNode";
import { ImageBlockNode } from "./embeds/imageBlockNode";
import { PropertiesNode } from "./embeds/propertiesNode";
import { ComponentListNode } from "./embeds/componentListNode";
import { CardNode } from "./embeds/cardNode";
import { GOLD_THEME } from "./goldTheme";

export interface StatDefinition {
  id?: string;
  key: string;
  label: string;
  description: string;
}

export interface RulesetClassModifier {
  name: string;
  value: number;
}

export interface TraitFieldDef {
  id: string;
  label: string;
}

export function traitFieldKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function applyTraitFieldValues(
  description: string,
  fields: TraitFieldDef[],
  values: Record<string, string>,
): string {
  return fields.reduce((desc, f) => {
    const key = traitFieldKey(f.label);
    return key ? desc.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), values[f.id] ?? "") : desc;
  }, description);
}

export interface TraitAssignment {
  traitId: string;
  values: Record<string, string>;
}

export interface RulesetSpecieTrait {
  id: string;
  name: string;
  description: string;
  fields: TraitFieldDef[];
}

export interface RulesetSpecie {
  id: string;
  name: string;
  size: Array<"tiny" | "small" | "medium" | "large" | "huge" | "gargantuan">;
  description: string;
  unit: "ft" | "m";
  movements: { label: string; value: number }[];
  senses: { label: string; value: number }[];
  statModifiers: Record<string, number>;
  traitAssignments: TraitAssignment[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  damageVulnerabilities: string[];
}

export interface RulesetClassLevelFeature {
  level: number;
  traitIds: string[];
}

export interface RulesetClass {
  id: string;
  name: string;
  description: string;
  modifiers: RulesetClassModifier[];
  primaryAbility: string;
  hitDie: string;
  savingThrowProficiencies: string[];
  skillProficiencies: { count: number; options: string[] };
  levelFeatures: RulesetClassLevelFeature[];
  image?: string;
  color?: string;
  featureTable?: {
    columns: { id: string; label: string; type?: "text" | "traits"; autofill?: boolean }[];
    rows: { id: string; cells: Record<string, string | string[]> }[];
  };
}

export interface RulesetSkill {
  id: string;
  name: string;
  statKey: string;
  description: string;
}

export interface RulesetRule {
  id: string;
  name: string;
  description: string;
  category?: string;
}

export interface RulesetCustomSection {
  id: string;
  name: string;
  content: string;
  // Absent for a top-level "System" page; set when this page was created as
  // a child of another (via a page-gallery block on the parent), which is
  // what drives the sidebar tree and the breadcrumb trail.
  parentId?: string;
}

// A "page gallery" is a fenced ```pages block embedded directly in a
// section's markdown content, holding JSON instead of prose. Each card
// links to another RulesetCustomSection by id (a child page); title/image
// are optional per-card overrides shown on the card itself. Giving the
// container its own id lets multiple galleries coexist in one document â€”
// updates target the one whose id matches, via a regex find-and-replace
// over the raw markdown rather than any AST/position bookkeeping.
export interface RulesetPageCardRef { pageId: string; title?: string; image?: string }
export interface RulesetPageContainerData { id: string; layout: "col" | "row" | "grid"; items: RulesetPageCardRef[] }

// Pretty-printed (not single-line minified JSON) so a block reads as actual
// indented, line-broken text in the raw editor â€” legible, and sane to
// hand-edit there too, rather than one dense unreadable line.
export function stringifyEmbed(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// An inline image, embedded the same way a page gallery is: a fenced
// ```image block holding JSON instead of prose. `align` "left"/"right"
// floats the image so surrounding paragraphs wrap it (plain CSS float on a
// block that sits before them in the markdown flow â€” no layout code needed
// beyond that); "full" just means not floated (a centered block). width/height
// are pixel dimensions set by dragging the block's own resize handle.
// `lockAspect` (default true when absent, for old saved blocks) governs
// which handles that drag exposes: locked keeps the box at the image's own
// natural proportions (only left/right handles, height follows width);
// unlocked adds top/bottom handles too, so height can be set independently
// (the image crops via object-cover to fill whatever box results).
export interface RulesetImageBlockData { id: string; src: string; align: "left" | "right" | "full"; width: number; height: number; lockAspect?: boolean }

// A key/value fact list, styled to match the read-only property table
// already used on class cards (class-card.tsx) â€” no header row, first
// column bold and shrink-to-content, a thin divider between rows. Unlike
// that one, this is directly editable: every label/value is a plain input.
export interface RulesetPropertyRow { label: string; value: string }
export interface RulesetPropertiesBlockData { id: string; rows: RulesetPropertyRow[] }

// A "component list" is a fenced ```components block — deliberately a
// separate node/type from the page gallery above rather than an extension of
// it, so the page gallery keeps working exactly as it already does for any
// document that used it. Each item is either a "page" card (identical
// behavior to a page-gallery card: click navigates to a child page) or a
// "card" (its own inline markdown, edited live via a nested
// MarkdownLiveEditor instance right in place — a real editor inside the
// editor, not a raw-text/preview toggle) — every item needs its own stable
// `id` regardless of kind, since a card has no pageId to key off of.
export interface RulesetComponentCardRef {
  id: string;
  kind: "page" | "card";
  // "page" kind — the card's own visual *is* the linked page's cover (its
  // bannerImage/bannerColor, see RulesetCustomSection/PageBanner): nothing
  // page-specific is stored on the item itself beyond which page it points
  // to, so the card always reflects whatever that page's cover currently is.
  pageId?: string;
  title?: string;
  // "card" kind:
  content?: string;
}
export interface RulesetComponentListData { id: string; name?: string; layout: "col" | "grid"; columns?: number; items: RulesetComponentCardRef[] }

// A standalone "card" block — a fenced ```card block wrapping a single
// nested MarkdownLiveEditor instance, styled as a bordered panel so its
// content visually reads as a card. Same nested-editor idea as a
// component-list "card" item (RulesetComponentCardRef with kind "card"),
// just insertable on its own via "/" rather than only from inside a list.
export interface RulesetCardBlockData { id: string; content: string }

// Uploaded images (the Image block, page-gallery card thumbnails) are saved
// to disk under the ruleset's own asset folder via save_ruleset_image and
// referenced from then on by filename only â€” the JSON in the markdown
// content stays a short string instead of a multi-thousand-line base64 blob.
async function saveRulesetImageFile(rulesetId: string, file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const filename = `${crypto.randomUUID()}.${ext}`;
  await invoke("save_ruleset_image", { rulesetId, filename, bytes: Array.from(new Uint8Array(buffer)) });
  return filename;
}

// Every keystroke in the raw editor re-parses the whole markdown string
// into a brand-new AST, so react-markdown mounts brand-new element/component
// instances for every embedded image on every keystroke â€” even ones nowhere
// near what was actually typed. Without this cache, each of those remounts
// would re-fetch the file and only have something to show once the promise
// resolves, which is exactly the blink: a flash back to blank/placeholder
// on every edit. Caching the blob: URL by ruleset+filename means a remount
// finds it already there and paints immediately, blink-free.
const rulesetImageUrlCache = new Map<string, string>();

export function deleteRulesetImageFile(rulesetId: string, filename: string) {
  invoke("delete_ruleset_image", { rulesetId, filename }).catch(() => {});
  const key = `${rulesetId}/${filename}`;
  const cached = rulesetImageUrlCache.get(key);
  if (cached) { URL.revokeObjectURL(cached); rulesetImageUrlCache.delete(key); }
}

// Reads a saved asset's bytes back and hands out a blob: URL to display it â€”
// the file lives outside the webview's origin, so it can't just be used as
// an <img src> directly without either this or configuring Tauri's asset
// protocol scope (which this app doesn't have set up).
function useRulesetImageUrl(rulesetId: string, filename: string | undefined): string | null {
  const cacheKey = filename ? `${rulesetId}/${filename}` : null;
  const [url, setUrl] = useState<string | null>(() => (cacheKey && rulesetImageUrlCache.get(cacheKey)) || null);

  useEffect(() => {
    if (!cacheKey || !filename) { setUrl(null); return; }
    const cached = rulesetImageUrlCache.get(cacheKey);
    if (cached) { setUrl(cached); return; }
    let cancelled = false;
    invoke<number[]>("read_ruleset_image", { rulesetId, filename }).then(bytes => {
      if (cancelled) return;
      const objectUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)]));
      rulesetImageUrlCache.set(cacheKey, objectUrl);
      setUrl(objectUrl);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [cacheKey, rulesetId, filename]);

  return url;
}

function RulesetAssetImage({ rulesetId, filename, className, style, onLoad }: {
  rulesetId: string;
  filename: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  const url = useRulesetImageUrl(rulesetId, filename);
  return url ? <img src={url} className={className} style={style} onLoad={onLoad} /> : null;
}

// Walks parentId pointers from `id` up to a root page, root-first â€” used to
// both auto-expand a page's ancestors in the sidebar tree and render the
// breadcrumb trail above it.
function sectionAncestors(sections: RulesetCustomSection[], id: string): RulesetCustomSection[] {
  const chain: RulesetCustomSection[] = [];
  let current = sections.find(s => s.id === id);
  while (current) {
    chain.unshift(current);
    const parentId: string | undefined = current.parentId;
    current = parentId ? sections.find(s => s.id === parentId) : undefined;
  }
  return chain;
}

// A page's displayed title comes from its own markdown rather than a
// separately-typed name â€” so writing a heading is all it takes to title the
// page. Prefers the first *H1* anywhere in the content (so a page that
// opens with a plain paragraph before its real heading still titles off
// the heading, not the paragraph); falls back to the first non-blank line
// of any kind, heading or not, when there's no H1 yet; falls back to the
// stored name only while a page is entirely blank.
export function deriveSectionTitle(section: RulesetCustomSection): string {
  const h1Line = section.content.split("\n").find(l => /^#\s+\S/.test(l.trim()));
  if (h1Line) return h1Line.trim().replace(/^#\s+/, "") || section.name;
  const firstLine = section.content.split("\n").find(l => l.trim().length > 0);
  if (!firstLine) return section.name;
  const stripped = firstLine.trim().replace(/^#{1,6}\s+/, "");
  return stripped || section.name;
}

// Same idea as deriveSectionTitle, but specifically the first *H1* — not
// just whatever the first non-blank line happens to be, heading or not.
// Used for a component-list "page" card's title, where a page opening with
// plain prose (no heading yet) shouldn't have that prose mistaken for a
// title.
function deriveFirstH1Title(section: RulesetCustomSection): string {
  const h1Line = section.content.split("\n").find(l => /^#\s+\S/.test(l.trim()));
  if (!h1Line) return section.name;
  const stripped = h1Line.trim().replace(/^#\s+/, "");
  return stripped || section.name;
}

export interface Ruleset {
  id: string;
  name: string;
  description: string;
  modifierFormula: string;
  skillFormula: string;
  maxLevel: number;
  stats: StatDefinition[];
  classes: RulesetClass[];
  skills: RulesetSkill[];
  traits: RulesetSpecieTrait[];
  species: RulesetSpecie[];
  rules: RulesetRule[];
  ruleCategories: string[];
  customSections: RulesetCustomSection[];
}

const NAV_ITEMS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "classes",  label: "Classes",  icon: Layers      },
  { id: "general",  label: "General",  icon: Settings2   },
  { id: "rules",    label: "Rules",    icon: ScrollText  },
  { id: "skills",   label: "Skills",   icon: Sparkles    },
  { id: "species",  label: "Species",  icon: Users       },
  { id: "stats",    label: "Stats",    icon: BarChart3   },
  { id: "traits",   label: "Traits",   icon: Star        },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateClass(c: any): RulesetClass {
  return {
    ...c,
    primaryAbility:           c.primaryAbility           ?? "",
    hitDie:                   c.hitDie                   ?? "",
    savingThrowProficiencies: c.savingThrowProficiencies ?? [],
    skillProficiencies:       c.skillProficiencies       ?? { count: 0, options: [] },
    levelFeatures:            c.levelFeatures            ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateSpecie(sp: any): RulesetSpecie {
  const base = sp.id ? sp : { ...sp, id: crypto.randomUUID() };
  const traitAssignments: TraitAssignment[] =
    base.traitAssignments ??
    (base.traitIds ?? []).map((id: string) => ({ traitId: id, values: {} }));
  return { ...base, traitAssignments };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateTrait(t: any): RulesetSpecieTrait {
  const base = t.id ? t : { ...t, id: crypto.randomUUID() };
  return { ...base, fields: base.fields ?? [] };
}

function emptyPageGalleryMarkdown(): string {
  const data: RulesetPageContainerData = { id: crypto.randomUUID(), layout: "col", items: [] };
  return "```pages\n" + stringifyEmbed(data) + "\n```";
}

function emptyImageBlockMarkdown(): string {
  const data: RulesetImageBlockData = { id: crypto.randomUUID(), src: "", align: "full", width: 320, height: 200, lockAspect: true };
  return "```image\n" + stringifyEmbed(data) + "\n```";
}

function emptyPropertiesBlockMarkdown(): string {
  // Empty, not literal "Label"/"Value" text â€” the inputs already show that
  // as placeholder styling (background-ish, gone the moment you type),
  // matching how a row added later via the "+" button starts out too.
  const data: RulesetPropertiesBlockData = { id: crypto.randomUUID(), rows: [{ label: "", value: "" }] };
  return "```props\n" + stringifyEmbed(data) + "\n```";
}

function emptyComponentListMarkdown(): string {
  const data: RulesetComponentListData = { id: crypto.randomUUID(), layout: "col", items: [] };
  return "```components\n" + stringifyEmbed(data) + "\n```";
}

function emptyCardMarkdown(): string {
  const data: RulesetCardBlockData = { id: crypto.randomUUID(), content: "" };
  return "```card\n" + stringifyEmbed(data) + "\n```";
}

// Ruleset-specific "/" menu entries — page gallery/image/properties/
// component list — appended after MarkdownLiveEditor's own built-in
// defaults (headings, lists, quote, code, table, etc., now owned by the
// markdown-live-editor package itself) via the `slashGroups` prop, not
// baked into the editor.
export const EMBED_SLASH_GROUP: SlashGroup = {
  section: "Embed",
  blocks: [
    { label: "Page Gallery", markdown: emptyPageGalleryMarkdown, icon: Files },
    { label: "Image", markdown: emptyImageBlockMarkdown, icon: Image },
    { label: "Properties", markdown: emptyPropertiesBlockMarkdown, icon: Table2 },
    { label: "Component List", markdown: emptyComponentListMarkdown, icon: Blocks },
    { label: "Card", markdown: emptyCardMarkdown, icon: CreditCard },
  ],
};

// A standalone "card" block — see RulesetCardBlockData above. Renders in
// place of the fenced ```card code block that stores it (see CardNode's
// markdown serialization). Not boxed/collapsible like a component list —
// just a bordered panel around one always-live nested MarkdownLiveEditor,
// so its height is whatever its content renders to.
export function CardBlockComponent({ data, ctx, onUpdate }: {
  data: RulesetCardBlockData;
  ctx: EmbedContext;
  onUpdate: (next: RulesetCardBlockData) => void;
}) {
  return (
    <div
      className="my-3 rounded-lg border border-gold-500/20 bg-black/20 p-3"
      style={{ whiteSpace: "normal" }}
      onKeyDown={e => e.stopPropagation()}
    >
      <EmbedContextReact.Provider value={ctx}>
        <MarkdownLiveEditor
          content={data.content ?? ""}
          onChange={(content: string) => onUpdate({ ...data, content })}
          theme={GOLD_THEME}
          slashGroups={[EMBED_SLASH_GROUP]}
          extensions={[PageGalleryNode, ImageBlockNode, PropertiesNode, ComponentListNode, CardNode]}
        />
      </EmbedContextReact.Provider>
    </div>
  );
}
// A "page gallery" block: a small card grid/row/column embedded inline in a
// page's markdown, each card linking to a child page. Renders in place of
// the fenced ```pages code block that stores it (see SectionMarkdown below).
export function PageContainerBlock({ data, rulesetId, allSections, onNavigate, onUpdate, onAddPage }: {
  data: RulesetPageContainerData;
  rulesetId: string;
  allSections: RulesetCustomSection[];
  onNavigate: (id: string) => void;
  onUpdate: (next: RulesetPageContainerData) => void;
  onAddPage: () => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const layoutClass = data.layout === "row"
    ? "flex flex-row flex-wrap gap-2"
    : data.layout === "grid"
      ? "grid grid-cols-3 gap-2"
      : "flex flex-col gap-2";
  const cardWidthClass = data.layout === "row" ? "w-40 shrink-0" : "w-full";

  const setLayout = (layout: RulesetPageContainerData["layout"]) => onUpdate({ ...data, layout });
  const updateItem = (index: number, patch: Partial<RulesetPageCardRef>) =>
    onUpdate({ ...data, items: data.items.map((it, i) => i === index ? { ...it, ...patch } : it) });
  const removeItem = (index: number) => {
    const removedImage = data.items[index]?.image;
    onUpdate({ ...data, items: data.items.filter((_, i) => i !== index) });
    if (removedImage) deleteRulesetImageFile(rulesetId, removedImage);
  };

  const handleImagePick = (index: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const previousImage = data.items[index]?.image;
    const filename = await saveRulesetImageFile(rulesetId, file).catch(() => null);
    if (!filename) return;
    updateItem(index, { image: filename });
    if (previousImage) deleteRulesetImageFile(rulesetId, previousImage);
  };

  return (
    <div className="my-3 rounded-md border border-gold-500/15 bg-black/20 p-2" style={{ whiteSpace: "normal" }}>
      <div className="flex items-center justify-end gap-1 mb-2">
        {([["col", Rows3], ["row", Columns3], ["grid", LayoutGrid]] as const).map(([l, Icon]) => (
          <button
            key={l}
            onClick={() => setLayout(l)}
            className={`w-6! h-6! p-0! flex! items-center! justify-center! ${data.layout === l ? "border-gold-500! text-gold-300!" : "border-gold-500/20! text-gold-700!"}`}
            title={l}
          >
            <Icon className="h-3 w-3" />
          </button>
        ))}
      </div>
      <div className={layoutClass}>
        {data.items.map((item, i) => {
          const page = allSections.find(s => s.id === item.pageId);
          const editing = editingIndex === i;
          return (
            <div
              key={item.pageId + i}
              className={`group relative flex flex-col overflow-hidden rounded-md border border-gold-500/20 bg-surface transition-colors ${cardWidthClass} ${editing ? "" : "hover:border-gold-500/50 cursor-pointer"}`}
              onClick={() => !editing && onNavigate(item.pageId)}
            >
              {editing ? (
                <div className="p-2 flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={item.title ?? ""}
                    placeholder={page ? deriveSectionTitle(page) : "Title"}
                    onChange={e => updateItem(i, { title: e.target.value })}
                    className="text-xs! h-7!"
                  />
                  <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick(i)} />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => imgInputRef.current?.click()}
                      className="flex-1 h-6! text-[10px]! px-1.5! gap-1! flex! items-center! justify-center!"
                    >
                      <ImagePlus className="h-3 w-3" /> Image
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="h-6! text-[10px]! px-2! bg-gold-500! text-gray-900! border-gold-500!"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingIndex(i); }}
                      className="w-5! h-5! p-0! flex! items-center! justify-center! bg-base/80!"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                      className="w-5! h-5! p-0! flex! items-center! justify-center! bg-base/80! hover:text-red-400!"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  {item.image
                    ? <RulesetAssetImage rulesetId={rulesetId} filename={item.image} className="w-full h-20 object-cover" />
                    : <div className="w-full h-20 flex items-center justify-center bg-gold-500/5 text-gold-700"><Files className="h-5 w-5" /></div>}
                  <div className="px-2 py-1.5 min-w-0">
                    <p className="text-xs font-semibold text-gold-300 truncate m-0">{item.title || (page ? deriveSectionTitle(page) : "") || "Untitled"}</p>
                    {!page && <p className="text-[10px] text-red-400/70 m-0">Missing page</p>}
                  </div>
                </>
              )}
            </div>
          );
        })}
        <button
          onClick={onAddPage}
          className={`flex! flex-col! items-center! justify-center! gap-1! text-xs! h-24! border-dashed! border-gold-500/30! text-gold-600! hover:text-gold-400! hover:border-gold-500/50! ${cardWidthClass}`}
        >
          <Plus className="h-4 w-4" /> Add Page
        </button>
      </div>
    </div>
  );
}

const DEFAULT_CARD_COLOR = "#2a2a2a";

// Scans a page's own markdown for the first ```image fenced block and
// returns its `src` (an uploaded filename, same shape as RulesetImageBlockData)
// — no separate cover to upload/maintain, the card just shows whatever
// image the page's own content already has, the same way its title is
// derived from the page's first H1 rather than typed separately.
function deriveFirstImage(section: RulesetCustomSection): string | undefined {
  const match = section.content.match(/```image\n([\s\S]*?)\n```/);
  if (!match) return undefined;
  try {
    const data = JSON.parse(match[1]) as RulesetImageBlockData;
    return data.src || undefined;
  } catch {
    return undefined;
  }
}

// A component-list "page" card — a tall card whose visual is the first
// image found in the linked page's own markdown, with the page's own title
// along the bottom. Falls back to a plain dark card (with a placeholder
// sparkle) when the page has no image yet. Its own component rather than
// inlined in ComponentListBlock's map() purely so the file stays readable
// at this size.
function ComponentListPageCard({ item, page, rulesetId, onNavigate, onRemove }: {
  item: RulesetComponentCardRef;
  page: RulesetCustomSection | undefined;
  rulesetId: string;
  onNavigate: (id: string) => void;
  onRemove: () => void;
}) {
  const title = page ? deriveFirstH1Title(page) : "Untitled";
  const image = page ? deriveFirstImage(page) : undefined;

  return (
    <div
      className="group relative flex flex-col items-end justify-end overflow-hidden rounded-xl border border-gold-500/30 cursor-pointer w-full h-40 p-3"
      style={{ background: DEFAULT_CARD_COLOR }}
      onClick={() => item.pageId && onNavigate(item.pageId)}
    >
      {image
        ? <RulesetAssetImage rulesetId={rulesetId} filename={image} className="absolute inset-0 w-full h-full object-cover" />
        : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-16 w-16 text-white/60" />
          </div>
        )}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/5 to-transparent" />

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1 right-1 z-20 w-5! h-5! p-0! flex! items-center! justify-center! bg-black/50! opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400!"
        title="Delete"
      >
        <Trash2 className="h-2.5 w-2.5" />
      </button>

      <div className="relative z-10 w-full text-center">
        <p className="text-sm font-semibold text-white truncate m-0">{title}</p>
        {!page && <p className="text-[10px] text-red-300 m-0">Missing page</p>}
      </div>
    </div>
  );
}

// A "component list" block — deliberately its own component rather than a
// variant of PageContainerBlock above, so that one keeps working completely
// unmodified for any existing document using it. Not boxed like a page
// gallery is — just a named section (the `name` field is its own identifier,
// shown/edited inline) holding a single-column or grid (with a configurable
// column count) arrangement of cards, added
// via one full-width "+" button that offers a choice between a "page" card
// (identical behavior to a page-gallery card — click navigates to a child
// page) and a "card" (its own markdown, edited live in place via a nested
// MarkdownLiveEditor — never collapsed, sized to whatever it contains rather
// than any fixed height).
export function ComponentListBlock({ data, ctx, selected, onUpdate, onAddPageCard }: {
  data: RulesetComponentListData;
  ctx: EmbedContext;
  // Drives whether the identifier row shows at all — it's only relevant
  // while you're actually working on this block (clicked its drag handle),
  // not as permanent chrome sitting above the cards.
  selected: boolean;
  onUpdate: (next: RulesetComponentListData) => void;
  onAddPageCard: () => void;
}) {
  const { rulesetId, allSections, onNavigate } = ctx;
  const [addOpen, setAddOpen] = useState(false);
  // The one card whose nested editor should actually take focus on mount —
  // every other card (pre-existing ones, all mounting together when this
  // block first renders) passes `autofocus={false}` so they don't all fight
  // over it; see MarkdownLiveEditor's own `autofocus` prop.
  const [justAddedCardId, setJustAddedCardId] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!addMenuRef.current?.contains(e.target as Node)) setAddOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [addOpen]);

  const columns = data.columns ?? 3;
  const isGrid = data.layout === "grid";
  const layoutClass = isGrid ? "grid gap-2" : "flex flex-col gap-2";
  const layoutStyle: React.CSSProperties | undefined = isGrid
    ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : undefined;
  const cardWidthClass = "w-full";

  const setLayout = (layout: RulesetComponentListData["layout"]) => onUpdate({ ...data, layout });
  const setColumns = (next: number) => onUpdate({ ...data, columns: Math.min(8, Math.max(2, next)) });
  const updateItem = (id: string, patch: Partial<RulesetComponentCardRef>) =>
    onUpdate({ ...data, items: data.items.map(it => it.id === id ? { ...it, ...patch } : it) });
  const removeItem = (id: string) => {
    onUpdate({ ...data, items: data.items.filter(it => it.id !== id) });
  };
  const addCard = () => {
    const id = crypto.randomUUID();
    onUpdate({ ...data, items: [...data.items, { id, kind: "card", content: "" }] });
    setJustAddedCardId(id);
    setAddOpen(false);
  };

  return (
    <div className={`flex flex-col gap-2 rounded-md transition-[padding] duration-200 ${selected ? "p-2" : "p-0"}`} style={{ whiteSpace: "normal" }}>
      <div className={`grid transition-[grid-template-rows] duration-200 ${selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
        <div className="overflow-hidden">
          <div
            className="flex items-center gap-2"
            onKeyDown={e => e.stopPropagation()}
          >
            <input
              value={data.name ?? ""}
              onChange={e => onUpdate({ ...data, name: e.target.value })}
              placeholder="Untitled"
              className="flex-1 min-w-0 bg-transparent border-none outline-none p-0 h-auto text-sm font-semibold text-gold-300 placeholder:text-gold-700"
            />
            <div className="flex items-center gap-1 shrink-0">
              {isGrid && (
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={columns}
                  onChange={e => setColumns(Number(e.target.value) || columns)}
                  title="Columns"
                  className="w-10! h-6! p-0! text-[10px]! text-center!"
                />
              )}
              {([["col", Rows3], ["grid", LayoutGrid]] as const).map(([l, Icon]) => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`w-6! h-6! p-0! flex! items-center! justify-center! ${data.layout === l ? "border-gold-500! text-gold-300!" : "border-gold-500/20! text-gold-700!"}`}
                  title={l}
                >
                  <Icon className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {data.items.length > 0 && (
        <div className={layoutClass} style={layoutStyle}>
          {data.items.map(item => {
            if (item.kind === "page") {
              const page = allSections.find(s => s.id === item.pageId);
              return (
                <ComponentListPageCard
                  key={item.id}
                  item={item}
                  page={page}
                  rulesetId={rulesetId}
                  onNavigate={onNavigate}
                  onRemove={() => removeItem(item.id)}
                />
              );
            }

            // "card" kind — a real nested MarkdownLiveEditor, always live/
            // editable in place (no separate edit/preview toggle, no
            // collapse) so its height is just however tall the content
            // itself renders.
            return (
              <div
                key={item.id}
                className={`group relative rounded-md border pr-4 h-fit border-gold-500/10 ${cardWidthClass}`}
                onKeyDown={e => e.stopPropagation()}
              >
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 z-10 w-5! h-5! p-0! flex! items-center! justify-center! bg-base/80! opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400!"
                  title="Remove"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
                <EmbedContextReact.Provider value={ctx}>
                  <MarkdownLiveEditor
                    content={item.content ?? ""}
                    onChange={(content: string) => updateItem(item.id, { content })}
                    theme={GOLD_THEME}
                    slashGroups={[EMBED_SLASH_GROUP]}
                    extensions={[PageGalleryNode, ImageBlockNode, PropertiesNode, ComponentListNode, CardNode]}
                    autofocus={item.id === justAddedCardId}
                  />
                </EmbedContextReact.Provider>
              </div>
            );
          })}
        </div>
      )}
      {/* `addMenuRef`/the dropdown itself live *outside* the collapse
          wrapper's own `overflow-hidden` on purpose — that overflow is only
          there so the button's own height can animate in/out via the
          grid-rows trick below; nesting the dropdown inside it clipped the
          menu invisible the instant it tried to render outside the
          (collapsed-height) row, even though `addOpen` was toggling fine. */}
      <div className="relative" ref={addMenuRef}>
        <div className={`grid transition-[grid-template-rows] duration-200 ${selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
          <div className="overflow-hidden">
            <button
              onClick={() => setAddOpen(o => !o)}
              className="w-full! h-9! mt-1! flex! items-center! justify-center! border-dashed! border-gold-500/30! text-gold-600! hover:text-gold-400! hover:border-gold-500/50!"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        {addOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-surface border border-gold-500/30 rounded-md overflow-hidden shadow-lg">
            <button
              onClick={() => { onAddPageCard(); setAddOpen(false); }}
              className="w-full! h-9! border-0! rounded-none! justify-start! px-3! gap-2! bg-transparent! text-gold-400! hover:bg-gold-500/10!"
            >
              <Files className="h-3.5 w-3.5" /> Page
            </button>
            <button
              onClick={addCard}
              className="w-full! h-9! border-0! rounded-none! justify-start! px-3! gap-2! bg-transparent! text-gold-400! hover:bg-gold-500/10!"
            >
              <NotebookText className="h-3.5 w-3.5" /> Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// An inline image block: "left"/"right" float it so the paragraphs that
// follow it in the markdown wrap around it (plain CSS float â€” the block
// just needs to render before them in the DOM, which it already does since
// markdown blocks render as ordered siblings); "full" is a plain block
// image at 100% width. Resizing happens by dragging a handle on the middle
// of each border, not a slider or a single free corner grip. By default
// (`lockAspect`) only left/right handles show, and width/height are kept
// locked to the image's own natural proportions; the lock toggle in the
// hover toolbar switches to a free mode that also exposes top/bottom
// handles, so height can be set independently of width (the image crops
// via object-cover to fill whatever box results, rather than stretching).
const IMAGE_MIN_SIZE = 60;
const IMAGE_MAX_SIZE = 900;
type ImageEdge = "left" | "right" | "top" | "bottom";

export function ImageBlockComponent({ data, rulesetId, onUpdate, onRemove }: {
  data: RulesetImageBlockData;
  rulesetId: string;
  onUpdate: (next: RulesetImageBlockData) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Local-only while dragging: this component re-renders on every mouse
  // move for live feedback, but committing through onUpdate on every frame
  // would rewrite (and re-parse) the whole markdown string that often â€”
  // instead the drag only touches this component's own state, and the real
  // content update fires once on mouseup.
  const [dragSize, setDragSize] = useState<{ width: number; height: number } | null>(null);
  const width = dragSize?.width ?? data.width;
  const height = dragSize?.height ?? data.height;
  const lockAspect = data.lockAspect ?? true;
  // The image's own natural proportions, captured once it loads â€” dragging
  // a single edge scales the other dimension to match, so the picture
  // never gets stretched or squashed, only made bigger or smaller.
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const previousSrc = data.src;
    setAspectRatio(null);
    const filename = await saveRulesetImageFile(rulesetId, file).catch(() => null);
    if (!filename) return;
    onUpdate({ ...data, src: filename });
    if (previousSrc) deleteRulesetImageFile(rulesetId, previousSrc);
  };

  const startEdgeResize = (edge: ImageEdge) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = data.width;
    const startHeight = data.height;
    const clamp = (n: number) => Math.min(IMAGE_MAX_SIZE, Math.max(IMAGE_MIN_SIZE, Math.round(n)));

    const compute = (clientX: number, clientY: number) => {
      if (edge === "left" || edge === "right") {
        const dx = clientX - startX;
        const nextWidth = clamp(startWidth + (edge === "right" ? dx : -dx));
        const nextHeight = lockAspect && aspectRatio ? clamp(nextWidth / aspectRatio) : startHeight;
        return { width: nextWidth, height: nextHeight };
      }
      const dy = clientY - startY;
      const nextHeight = clamp(startHeight + (edge === "bottom" ? dy : -dy));
      const nextWidth = lockAspect && aspectRatio ? clamp(nextHeight * aspectRatio) : startWidth;
      return { width: nextWidth, height: nextHeight };
    };

    const onMove = (ev: MouseEvent) => setDragSize(compute(ev.clientX, ev.clientY));
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      onUpdate({ ...data, ...compute(ev.clientX, ev.clientY) });
      setDragSize(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // maxWidth caps it at the width of whatever column it's sitting in (never
  // wider than the text, capping out at effectively "full width" for a big
  // image) â€” aspectRatio (not a fixed height) is what keeps the box's shape
  // correct when that cap actually kicks in and shrinks the rendered width,
  // since a fixed height wouldn't shrink along with it and the box would
  // end up squashed/stretched relative to its own content.
  const floatStyle: React.CSSProperties = {
    width,
    maxWidth: "100%",
    aspectRatio: `${width} / ${height}`,
    ...(data.align === "full"
      ? { margin: "0.75rem auto" }
      : { float: data.align, margin: data.align === "left" ? "0.25rem 1rem 0.75rem 0" : "0.25rem 0 0.75rem 1rem" }),
  };

  const edgeHandleClass = "absolute bg-gold-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity border border-base/60";

  return (
    <div className="group relative" style={{ ...floatStyle, whiteSpace: "normal" }}>
      <div className="w-full h-full rounded-md border border-gold-500/20 bg-surface overflow-hidden">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
        {data.src ? (
          <div className="relative w-full h-full cursor-pointer" onClick={() => inputRef.current?.click()}>
            <RulesetAssetImage
              rulesetId={rulesetId}
              filename={data.src}
              className="w-full h-full object-cover block"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) setAspectRatio(img.naturalWidth / img.naturalHeight);
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-gold-300 text-xs flex items-center gap-1">
                <ImagePlus className="h-3.5 w-3.5" /> Replace
              </span>
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gold-500/5 text-gold-700 hover:text-gold-500 transition-colors cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Add image</span>
          </div>
        )}
      </div>

      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-base/80 rounded p-1">
        {([["left", AlignLeft], ["full", AlignJustify], ["right", AlignRight]] as const).map(([a, Icon]) => (
          <button
            key={a}
            onClick={() => onUpdate({ ...data, align: a })}
            className={`w-5! h-5! p-0! flex! items-center! justify-center! border-0! ${data.align === a ? "text-gold-300! bg-gold-500/20!" : "text-gold-700! bg-transparent!"}`}
            title={a === "full" ? "Centered" : `Float ${a}`}
          >
            <Icon className="h-3 w-3" />
          </button>
        ))}
        <button
          onClick={() => onUpdate({ ...data, lockAspect: !lockAspect })}
          className={`w-5! h-5! p-0! flex! items-center! justify-center! border-0! ${!lockAspect ? "text-gold-300! bg-gold-500/20!" : "text-gold-700! bg-transparent!"}`}
          title={lockAspect ? "Aspect ratio locked — click to resize height independently" : "Height unlocked — click to lock to the image's own proportions again"}
        >
          {lockAspect ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </button>
        <button
          onClick={onRemove}
          className="w-5! h-5! p-0! flex! items-center! justify-center! border-0! text-gold-700! hover:text-red-400! bg-transparent!"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div
        onMouseDown={startEdgeResize("left")}
        className={`${edgeHandleClass} w-1.5 h-6 left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize`}
        title="Drag to resize width"
      />
      <div
        onMouseDown={startEdgeResize("right")}
        className={`${edgeHandleClass} w-1.5 h-6 right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize`}
        title="Drag to resize width"
      />
      {!lockAspect && (
        <>
          <div
            onMouseDown={startEdgeResize("top")}
            className={`${edgeHandleClass} h-1.5 w-6 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize`}
            title="Drag to resize height"
          />
          <div
            onMouseDown={startEdgeResize("bottom")}
            className={`${edgeHandleClass} h-1.5 w-6 bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize`}
            title="Drag to resize height"
          />
        </>
      )}
    </div>
  );
}

// A key/value fact table, styled to match the read-only one already used on
// class cards (class-card.tsx: no header row, bold shrink-to-content label
// column, a thin divider between rows) â€” but every cell here is a plain
// input, editable directly in place rather than through a separate edit
// mode, since there's nothing more complex than text in a row.
export function PropertiesBlockComponent({ data, editable, onUpdate, renderValueInput }: {
  data: RulesetPropertiesBlockData;
  editable: boolean;
  onUpdate: (next: RulesetPropertiesBlockData) => void;
  // Optional override for how a row's value gets edited â€” defaults to a
  // plain text input (still what the raw-textarea mode's own preview pane
  // uses, since it stays framework-agnostic on purpose). The Tiptap live
  // editor's NodeView (propertiesNode.tsx) supplies a richer version
  // instead, one that actually renders **bold**/*italic*/`code` live as
  // you type rather than showing the raw markdown syntax until you stop
  // editing.
  renderValueInput?: (row: RulesetPropertyRow, onChange: (value: string) => void) => React.ReactNode;
}) {
  const updateRow = (index: number, patch: Partial<RulesetPropertyRow>) =>
    onUpdate({ ...data, rows: data.rows.map((r, i) => i === index ? { ...r, ...patch } : r) });
  const removeRow = (index: number) => onUpdate({ ...data, rows: data.rows.filter((_, i) => i !== index) });
  const addRow = () => onUpdate({ ...data, rows: [...data.rows, { label: "", value: "" }] });

  return (
    <div className="group relative mb-4" style={{ whiteSpace: "normal" }}>
      {data.rows.length > 0 && (
        <table className="w-full text-xs border-collapse">
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="group/row border-b border-gold-500/10 last:border-0 px-2">
                <td className="w-0 pl-2 pr-3 align-middle whitespace-nowrap">
                  {editable ? (
                    <input
                      value={row.label}
                      onChange={e => updateRow(i, { label: e.target.value })}
                      placeholder="Label"
                      className="field-sizing-content min-w-12 max-w-40 bg-transparent border-none outline-none p-0 m-0 text-gold-500 font-semibold text-xs placeholder:text-gold-700 placeholder:italic"
                    />
                  ) : (
                    <span className="text-gold-500 font-semibold text-xs">{row.label}</span>
                  )}
                </td>
                <td className="align-middle">
                  {editable ? (
                    <div className="flex items-center gap-1">
                      {renderValueInput ? renderValueInput(row, value => updateRow(i, { value })) : (
                        <input
                          value={row.value}
                          onChange={e => updateRow(i, { value: e.target.value })}
                          placeholder="Value"
                          className="flex-1 min-w-0 bg-transparent border-none outline-none p-0 m-0 text-gold-600 text-xs placeholder:text-gold-700 placeholder:italic"
                        />
                      )}
                      <button
                        onClick={() => removeRow(i)}
                        className="w-4! h-4! p-0! flex! items-center! justify-center! border-0! bg-transparent! text-gold-700! hover:text-red-400! opacity-0 group-hover/row:opacity-100! transition-opacity shrink-0"
                        title="Remove row"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    // Values render as real (inline-only) markdown, so **bold**
                    // or `code` written while editing shows up formatted once
                    // you're viewing the page â€” the <Markdown> component is
                    // used untouched, just stripped of its own paragraph
                    // margin/size from the outside so it sits inline in the cell.
                    <div className="text-gold-600 [&_p]:m-0 [&_p]:text-xs">
                      <Markdown>{row.value || "Â "}</Markdown>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editable && (
        <button
          onClick={addRow}
          title="Add row"
          className="absolute  left-0 opacity-0 group-hover:opacity-100 transition-opacity w-full h-4! p-0! flex! items-center! justify-center! border-0!  text-gold-700! hover:text-gold-400!"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Recursive sidebar rows for the "Systems" tree: each level renders the
// children of `parentId`, indenting further and recursing into its own
// children when expanded. Root call passes parentId=undefined.
function CustomSectionTree({
  sections, parentId, depth, activeSection, expandedSectionIds, toggleExpand,
  onSelect, onDeleteRequest,
}: {
  sections: RulesetCustomSection[];
  parentId?: string;
  depth: number;
  activeSection: string;
  expandedSectionIds: Set<string>;
  toggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onDeleteRequest: (id: string) => void;
}) {
  const children = sections.filter(s => s.parentId === parentId);
  if (children.length === 0) return null;

  return (
    <>
      {children.map(section => {
        const active = activeSection === section.id;
        const hasChildren = sections.some(s => s.parentId === section.id);
        const expanded = expandedSectionIds.has(section.id);
        // Every row â€” whether it has children or not â€” reads as the same
        // flat, full-width highlighted line as the fixed nav items above
        // (NAV_ITEMS): no border/card box. A row with children additionally
        // gets a chevron on the left that expands its children in place,
        // indented via `depth * 12` on the recursive call below.
        const rowClass = `group flex items-center gap-1 h-8 w-full pr-3 cursor-pointer transition-colors  ${
          active ? "bg-gold-500/30 " : "hover:bg-gold-500/15"
        }`;
        const textClass = active
          ? "text-gold-300 font-semibold"
          : "text-gold-500 group-hover:text-gold-300";
        return (
          <div key={section.id}>
            <div
              className={rowClass}
              style={{ paddingLeft: 8 + depth * 12 }}
              onClick={() => onSelect(section.id)}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExpand(section.id); }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="w-5! h-5! p-0! flex! items-center! justify-center! border-0! rounded-sm! text-gold-600! shrink-0 transition-colors! bg-transparent! hover:bg-gold-500/15!"
                >
                  <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
                </button>
              ) : (
                // No arrow to show, but the name still needs to land in the
                // same spot the arrow would've occupied â€” otherwise a leaf
                // row's text shifts left of its siblings that do have one,
                // breaking the "nested inside its parent" look.
                <span className="w-5 h-5 shrink-0" />
              )}
              <span className={`flex-1 min-w-0 truncate text-xs transition-colors ${textClass}`}>
                {deriveSectionTitle(section)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteRequest(section.id); }}
                className="w-5! h-5! p-0! flex! items-center! justify-center! opacity-0 group-hover:opacity-100 text-gold-700 hover:text-red-400 transition-opacity shrink-0"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            {hasChildren && expanded && (
              <CustomSectionTree
                sections={sections}
                parentId={section.id}
                depth={depth + 1}
                activeSection={activeSection}
                expandedSectionIds={expandedSectionIds}
                toggleExpand={toggleExpand}
                onSelect={onSelect}
                onDeleteRequest={onDeleteRequest}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export default function RulesetEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { existing?: Ruleset } | null;

  const [activeSection, setActiveSection] = useState<string>("classes");
  const [pendingDeleteSectionId, setPendingDeleteSectionId] = useState<string | null>(null);
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(new Set());

  const [ruleset, setRuleset] = useState<Ruleset>(() =>
    state?.existing
      ? {
          ...state.existing,
          modifierFormula: state.existing.modifierFormula || "({{stat_points}} - 10) / 2",
          skillFormula:    state.existing.skillFormula    || "{{stat_mod}} + {{proficiency_bonus}}",
          stats:           (state.existing.stats ?? []).map(s => s.id ? s : { ...s, id: crypto.randomUUID() }),
          skills:          state.existing.skills    ?? [],
          classes:         (state.existing.classes  ?? []).map(migrateClass),
          maxLevel:        state.existing.maxLevel   ?? 20,
          traits:          (state.existing.traits   ?? []).map(migrateTrait),
          species:         (state.existing.species  ?? []).map(migrateSpecie),
          rules:           (state.existing.rules    ?? []).map(r => r.id ? r : { ...r, id: crypto.randomUUID() }),
          ruleCategories:  state.existing.ruleCategories ?? [],
          customSections:  (state.existing.customSections ?? []).map(s => ({ ...s, content: s.content ?? "" })),
        }
      : {
          id: crypto.randomUUID(), name: "", description: "",
          modifierFormula: "({{stat_points}} - 10) / 2",
          skillFormula: "{{stat_mod}} + {{proficiency_bonus}}",
          maxLevel: 20, stats: [], classes: [], skills: [], traits: [], species: [], rules: [], ruleCategories: [],
          customSections: [],
        }
  );

  const handleSave = async () => {
    if (!ruleset.name.trim()) { toast.error("Ruleset name is required"); return; }
    await invoke("save_ruleset", { ruleset: { ...ruleset, name: ruleset.name.trim() } }).catch(() => {});
    toast.success("Ruleset saved");
    navigate(-1);
  };

  // parentId absent -> a top-level "System"; set -> a child page, created
  // either from the sidebar's own "+" or from inside a page gallery. Returns
  // the created section synchronously so a page-gallery block can push its
  // id into its own items list in the same click handler.
  const addCustomSection = (parentId?: string): RulesetCustomSection => {
    const section: RulesetCustomSection = { id: crypto.randomUUID(), name: parentId ? "New Page" : "New System", content: "", parentId };
    setRuleset(r => ({ ...r, customSections: [...r.customSections, section] }));
    setActiveSection(section.id);
    if (parentId) setExpandedSectionIds(ids => new Set(ids).add(parentId));
    return section;
  };

  // Deleting a page takes its whole subtree with it â€” an orphaned child
  // (parentId pointing at nothing) would otherwise become permanently
  // unreachable, since the sidebar only walks down from parentless roots.
  const deleteCustomSection = (id: string) => {
    const collectIds = (targetId: string, all: RulesetCustomSection[]): string[] => {
      const kids = all.filter(s => s.parentId === targetId).map(s => s.id);
      return [targetId, ...kids.flatMap(k => collectIds(k, all))];
    };
    const idsToDelete = new Set(collectIds(id, ruleset.customSections));
    setRuleset(r => ({ ...r, customSections: r.customSections.filter(s => !idsToDelete.has(s.id)) }));
    if (idsToDelete.has(activeSection)) setActiveSection("classes");
  };

  const activeCustomSection = ruleset.customSections.find(s => s.id === activeSection);
  const activeSectionAncestors = activeCustomSection ? sectionAncestors(ruleset.customSections, activeCustomSection.id) : [];

  // Keep every ancestor of the active page expanded in the sidebar tree so
  // navigating into a deeply nested page (via breadcrumb or a page-gallery
  // card) always leaves it visible, not collapsed under a closed parent.
  useEffect(() => {
    const ancestors = sectionAncestors(ruleset.customSections, activeSection);
    if (ancestors.length > 1) {
      setExpandedSectionIds(ids => {
        const next = new Set(ids);
        let changed = false;
        for (const a of ancestors.slice(0, -1)) if (!next.has(a.id)) { next.add(a.id); changed = true; }
        return changed ? next : ids;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  return (
    <main className="h-screen bg-base flex flex-col overflow-hidden relative">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
        <button className="w-9! h-9! flex items-center justify-center" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-gold-400 font-semibold text-sm">
          {state?.existing ? "Edit Ruleset" : "New Ruleset"}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="h-8! text-xs! px-3! gap-1.5! border-gold-500/40! text-gold-400!"
            onClick={() => navigate("/sheet-editor", { state: { rulesetId: ruleset.id } })}
          >
            Edit Sheet
          </button>
          <div className="w-px h-4 bg-gold-500/20 shrink-0" />
          <button className="px-4! h-8! text-xs! border-gold-500/30! text-gold-500!" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            className="px-4! h-8! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <nav className="w-56 shrink-0 border-r border-gold-500/20 flex flex-col overflow-y-auto">
          <div className="flex flex-col py-2">
            {NAV_ITEMS.map(item => {
              const active = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`group flex! items-center! gap-2! h-8! mx-2! my-0.5! px-2! rounded-md! justify-start! border-0! text-xs! transition-colors!
                    ${active
                      ? "bg-gold-500/15! text-gold-300! font-semibold!"
                      : "bg-transparent! text-gold-500! hover:bg-gold-500/8! hover:text-gold-300!"
                    }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-gold-300" : "text-gold-600 group-hover:text-gold-400"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-gold-500/20 flex flex-col">
            <div className="flex items-center justify-between px-3 h-9 bg-surface shrink-0">
              <span className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">Systems</span>
              <button
                onClick={() => addCustomSection()}
                className="w-6! h-6! p-0! flex items-center justify-center text-gold-600 hover:text-gold-300 transition-colors shrink-0"
                title="New system"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {ruleset.customSections.some(s => !s.parentId) && (
              <CustomSectionTree
                sections={ruleset.customSections}
                parentId={undefined}
                depth={0}
                activeSection={activeSection}
                expandedSectionIds={expandedSectionIds}
                toggleExpand={(id) => setExpandedSectionIds(ids => {
                  const next = new Set(ids);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                })}
                onSelect={setActiveSection}
                onDeleteRequest={setPendingDeleteSectionId}
              />
            )}
          </div>
        </nav>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {activeSection === "general"  && <GeneralSection  ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "stats"    && <StatsSection    ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "skills"   && <SkillsSection   ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "classes"  && <ClassesSection  ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "species"  && <SpeciesSection  ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "traits"   && <TraitsSection   ruleset={ruleset} setRuleset={setRuleset} />}
          {activeSection === "rules"    && <RulesSection    ruleset={ruleset} setRuleset={setRuleset} />}
          {activeCustomSection && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-4 h-10 shrink-0 bg-base border-b border-gold-500/20">
                <div className="flex items-center gap-1 text-[11px] flex-wrap min-w-0 flex-1">
                  {activeSectionAncestors.map((a, i) => (
                    <span key={a.id} className="flex items-center gap-1 min-w-0">
                      {i > 0 && <ChevronRight className="h-3 w-3 text-gold-800 shrink-0" />}
                      {i === activeSectionAncestors.length - 1 ? (
                        <span className="text-gold-300 font-semibold truncate">{deriveSectionTitle(a)}</span>
                      ) : (
                        <button
                          onClick={() => setActiveSection(a.id)}
                          className="border-0! bg-transparent! h-auto! p-0! text-gold-600! hover:text-gold-300! hover:underline! truncate"
                        >
                          {deriveSectionTitle(a)}
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col items-center overflow-hidden">
                <div className="w-full max-w-4xl h-full min-h-0 flex flex-col">
                  <EmbedContextReact.Provider
                    value={{
                      rulesetId: ruleset.id,
                      sectionId: activeCustomSection.id,
                      allSections: ruleset.customSections,
                      onNavigate: setActiveSection,
                      onAddPage: addCustomSection,
                    }}
                  >
                    <MarkdownLiveEditor
                      key={activeCustomSection.id}
                      content={activeCustomSection.content}
                      onChange={(content: string) => setRuleset(r => ({
                        ...r,
                        customSections: r.customSections.map(s => s.id === activeCustomSection.id ? { ...s, content } : s),
                      }))}
                      theme={GOLD_THEME}
                      slashGroups={[EMBED_SLASH_GROUP]}
                      extensions={[PageGalleryNode, ImageBlockNode, PropertiesNode, ComponentListNode, CardNode]}
                    />
                  </EmbedContextReact.Provider>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {pendingDeleteSectionId && (() => {
        const section = ruleset.customSections.find(s => s.id === pendingDeleteSectionId);
        const hasChildren = ruleset.customSections.some(s => s.parentId === pendingDeleteSectionId);
        return (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 p-6 w-80 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-red-400">
                <Trash2 className="h-4 w-4 shrink-0" />
                <p className="font-semibold text-sm">Delete System</p>
              </div>
              <p className="text-gold-400 text-xs">
                Delete <span className="font-semibold text-gold-200">"{section?.name}"</span>? Its content will be lost{hasChildren ? ", along with all of its sub-pages" : ""}.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1.5 text-xs text-gold-400 hover:text-gold-200 transition-colors"
                  onClick={() => setPendingDeleteSectionId(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1.5 text-xs text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  onClick={() => { deleteCustomSection(pendingDeleteSectionId); setPendingDeleteSectionId(null); }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
