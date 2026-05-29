import type React from "react";

export default function Field({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <label className="text-gold-600 text-[10px] font-semibold uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
