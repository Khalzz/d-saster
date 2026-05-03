export default function Badge({ children, bgColor, textColor, borderColor, className }: { children: React.ReactNode, bgColor?: string, textColor?: string, borderColor?: string, className?: string }) {
  return (
    <div className={`${bgColor ?? ""} ${textColor ?? "text-gold-dark"} ${borderColor ?? "border-gold-light"} border px-2 text-sm rounded-full ${className}`}>
      {children}
    </div>
  );
}
