import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "./Markdown";

export interface GlossaryTerm {
  name: string;
  description: string;
  badge?: string;
}

interface TooltipState {
  top: number;
  left: number;
  term: GlossaryTerm;
}

export function AutoTooltip({ children, terms, className }: {
  children: React.ReactNode;
  terms: GlossaryTerm[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [nudge, setNudge] = useState(0);

  const termMap = useMemo(() => {
    const map = new Map<string, GlossaryTerm>();
    for (const t of terms) {
      const key = t.name.trim().toLowerCase();
      if (key) map.set(key, t);
    }
    return map;
  }, [terms]);

  // Post-render scan: mark matching leaf elements with data-glossary so CSS can decorate them
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let decorating = false;

    const decorate = () => {
      if (decorating) return;
      decorating = true;
      container.querySelectorAll("[data-glossary]").forEach(el => el.removeAttribute("data-glossary"));
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
      let el = walker.nextNode() as Element | null;
      while (el) {
        if (el.children.length === 0) {
          const text = el.textContent?.trim() ?? "";
          if (text && termMap.has(text.toLowerCase())) el.setAttribute("data-glossary", "");
        }
        el = walker.nextNode() as Element | null;
      }
      decorating = false;
    };

    decorate();

    const observer = new MutationObserver((mutations) => {
      if (decorating) return;
      if (mutations.some(m => m.type === "childList" || m.type === "characterData")) decorate();
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [termMap]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element;
      // Only inspect leaf elements (no child elements, just text)
      if (target.children.length > 0) { setTooltip(null); return; }
      const text = target.textContent?.trim() ?? "";
      const match = text ? termMap.get(text.toLowerCase()) : undefined;
      if (!match) { setTooltip(null); return; }

      const rect = target.getBoundingClientRect();
      setNudge(0);
      setTooltip({ top: rect.top - 8, left: rect.left + rect.width / 2, term: match });

      requestAnimationFrame(() => {
        if (!tooltipRef.current) return;
        const tipRect = tooltipRef.current.getBoundingClientRect();
        let offset = 0;
        if (tipRect.left < 8) offset = 8 - tipRect.left;
        else if (tipRect.right > window.innerWidth - 8) offset = window.innerWidth - 8 - tipRect.right;
        if (offset !== 0) setNudge(offset);
      });
    };

    const onMouseLeave = () => setTooltip(null);

    container.addEventListener("mouseover", onMouseOver);
    container.addEventListener("mouseleave", onMouseLeave);
    return () => {
      container.removeEventListener("mouseover", onMouseOver);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [termMap]);

  return (
    <div ref={containerRef} className={className}>
      {children}
      {tooltip && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-50 -translate-x-1/2 -translate-y-full pointer-events-none bg-surface border border-gold-500/30 rounded-lg px-3 py-2 shadow-xl w-max max-w-64"
          style={{ top: tooltip.top, left: tooltip.left + nudge }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-gold-300 text-xs font-medium">{tooltip.term.name}</p>
            {tooltip.term.badge && (
              <span className="text-gold-600 text-[9px] font-semibold uppercase tracking-wider">
                {tooltip.term.badge}
              </span>
            )}
          </div>
          {tooltip.term.description && (
            <Markdown className="text-[10px]">{tooltip.term.description}</Markdown>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
