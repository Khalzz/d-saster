export function SectionBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 flex flex-col gap-4 w-2xl">
      {children}
    </div>
  );
}