export function SectionBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 w-full flex-1 overflow-y-auto min-h-0">
      <div className="py-6 w-4xl mx-auto h-fit flex flex-col">
        {children}
      </div>
    </div>
  );
}