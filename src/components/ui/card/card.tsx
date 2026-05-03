export default function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-surface border border-gold-500 rounded-md p-4 text-gold-500 overflow-auto ${className}`}>
      {children}
    </div>
  );
}