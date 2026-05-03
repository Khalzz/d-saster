export default function Button({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) {
  return (
    <div 
      className={`bg-surface border border-gold-500 w-fit p-2 rounded-md text-gold-500 hover:border-gold-400 hover:bg-surface-hover transition-all cursor-pointer select-none ring-0 active:ring active:ring-gold-500 ${className}`}
      onClick={onClick}>
      {children}
    </div>
  );
}