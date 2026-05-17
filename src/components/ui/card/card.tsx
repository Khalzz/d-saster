export default function Card({ children, className, title }: { children: React.ReactNode, className?: string, title?: string }) {
  return (
    <div
      className={`relative bg-surface border border-gold-500/30 rounded-lg p-3 text-gold-500 overflow-auto ${className}`}
      style={title ? { overflow: "visible" } : undefined}
    >
      {title && (
        <span className="absolute top-0 left-3 -translate-y-1/2 px-1.5 bg-base text-[10px] font-semibold uppercase tracking-widest text-gold-500/50">
          {title}
        </span>
      )}
      {children}
    </div>
  );
}
