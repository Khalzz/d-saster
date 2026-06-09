interface Props {
  nodeId: string;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function EditorPreviewWrapper({ nodeId, selectedIds, onSelect, children, className = "w-full" }: Props) {
  const isSelected = selectedIds.has(nodeId);
  return (
    <div
      className={`${className} cursor-pointer rounded-xs ${isSelected ? "outline-1 outline-offset-2 outline-gold-400" : ""}`}
      onClick={(e) => { e.stopPropagation(); onSelect(nodeId); }}
    >
      <div className={`${className} pointer-events-none`}>
        {children}
      </div>
    </div>
  );
}
