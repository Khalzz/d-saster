export function SavingThrowRow({ label, value }: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 border border-gold-500/20 rounded-lg px-1.5 py-1.5">
      <span className="text-gold-600 text-[9px] font-bold uppercase tracking-wide w-full text-center">
        {label.slice(0, 3).toUpperCase()}
      </span>
      <span className="text-sm font-semibold text-gold-300 text-center w-full">
        {value}
      </span>
    </div>
  );
}
