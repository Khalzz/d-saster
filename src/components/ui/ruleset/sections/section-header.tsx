export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 w-full bg-base p-4 border-b border-gold-500/20 justify-between">
      <h2 className="text-gold-400 text-lg font-bold shrink-0">{title}</h2>
      {action}
    </div>
  );
}