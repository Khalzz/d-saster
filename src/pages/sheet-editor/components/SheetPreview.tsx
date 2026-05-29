import {
  Rows3,
  Columns3,
  LayoutPanelTop,
} from "lucide-react";
import type {
  LayoutNode,
  SectionSettings,
  ColumnSettings,
} from "../types";

// ── Render a single node recursively ───────────────────────────────────────
function PreviewNode({
  node,
  selectedId,
  onSelect,
}: {
  node: LayoutNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const isSelected = selectedId === node.id;
  const { padding, gap } = node.settings;

  // ── Section ────────────────────────────────────────────────────────────
  if (node.type === "section") {
    const { title } = node.settings as SectionSettings;
    return (
      <div
        className={`rounded-lg border transition-colors cursor-pointer w-full ${
          isSelected
            ? "border-gold-400 shadow-[0_0_0_1px_rgba(200,168,75,0.3)]"
            : "border-gold-500/20 hover:border-gold-500/40"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
      >
        {/* Section header */}
        <div className="px-3 py-1.5 border-b border-gold-500/15">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-500/60 select-none">
            {title || "Section"}
          </span>
        </div>
        {/* Section body */}
        <div
          className="flex flex-col"
          style={{ padding, gap }}
        >
          {node.children.length === 0 ? (
            <EmptySlot label="Empty section" />
          ) : (
            node.children.map((child) => (
              <PreviewNode
                key={child.id}
                node={child}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Row ────────────────────────────────────────────────────────────────
  if (node.type === "row") {
    return (
      <div
        className={`rounded border border-dashed transition-colors cursor-pointer min-h-[40px] ${
          isSelected
            ? "border-gold-400 bg-gold-500/5"
            : "border-gold-500/15 hover:border-gold-500/30 bg-gold-500/[0.02]"
        }`}
        style={{ display: "flex", flexDirection: "row", padding, gap }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
      >
        {node.children.length === 0 ? (
          <EmptySlot label="Empty row" icon={<Rows3 className="h-3 w-3" />} />
        ) : (
          node.children.map((child) => (
            <PreviewNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    );
  }

  // ── Column ─────────────────────────────────────────────────────────────
  const colSettings = node.settings as ColumnSettings;
  const flexStyle: React.CSSProperties =
    colSettings.width > 0
      ? { flex: `0 0 ${colSettings.width}%`, maxWidth: `${colSettings.width}%` }
      : { flex: "1 1 0%", minWidth: 0 };

  return (
    <div
      className={`rounded border border-dashed transition-colors cursor-pointer min-h-[40px] ${
        isSelected
          ? "border-gold-400 bg-gold-500/5"
          : "border-gold-500/15 hover:border-gold-500/30 bg-gold-500/[0.02]"
      }`}
      style={{
        ...flexStyle,
        display: "flex",
        flexDirection: "column",
        padding,
        gap,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {node.children.length === 0 ? (
        <EmptySlot label="Empty column" icon={<Columns3 className="h-3 w-3" />} />
      ) : (
        node.children.map((child) => (
          <PreviewNode
            key={child.id}
            node={child}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}

// ── Empty slot placeholder ─────────────────────────────────────────────────
function EmptySlot({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-3 w-full">
      {icon && <span className="text-gold-700">{icon}</span>}
      <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
        {label}
      </span>
    </div>
  );
}

// ── Main exported component ────────────────────────────────────────────────
interface SheetPreviewProps {
  nodes: LayoutNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function SheetPreview({ nodes, selectedId, onSelect }: SheetPreviewProps) {
  return (
    <div
      className="flex-1 overflow-y-auto bg-base p-6"
      onClick={() => onSelect(null)}
    >
      <div className="max-w-4xl mx-auto bg-surface rounded-xl border border-gold-500/10 min-h-[600px]">
        <div className="p-6 flex flex-col gap-4">
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <LayoutPanelTop className="h-8 w-8 text-gold-700" />
              <p className="text-gold-700 text-xs select-none">
                Add elements from the hierarchy panel to start building
              </p>
            </div>
          ) : (
            nodes.map((node) => (
              <PreviewNode
                key={node.id}
                node={node}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
