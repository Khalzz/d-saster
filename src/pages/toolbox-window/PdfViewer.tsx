import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { Document, Page, Thumbnail } from "../../lib/pdf";
import "react-pdf/dist/Page/TextLayer.css";

const MAX_PAGE_WIDTH = 800;

export default function PdfViewer({ name, url, onBack }: {
  name: string;
  url: string;
  onBack: () => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pageWidth, setPageWidth] = useState(MAX_PAGE_WIDTH);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  // Pages are sized from the container's own width rather than the PDF's
  // native page size, so an unusually large or landscape-oriented PDF
  // still renders at a sane, consistent size instead of an oversized or
  // squashed-looking page.
  useEffect(() => {
    const el = pagesContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) setPageWidth(Math.min(MAX_PAGE_WIDTH, width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollToPage = (pageNumber: number) => {
    pageRefs.current[pageNumber - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gold-500/20 shrink-0">
        <ArrowLeft
          onClick={onBack}
          role="button"
          tabIndex={0}
          aria-label="Back"
          className="h-4 w-4 text-gold-500 hover:text-gold-300 cursor-pointer transition-colors shrink-0"
        />
        <span className="text-gold-300 text-xs font-semibold truncate flex-1">{name}</span>

        <div className="flex items-center gap-1.5 shrink-0">
          <Minus
            onClick={() => setScale(s => Math.max(0.5, +(s - 0.1).toFixed(2)))}
            role="button"
            tabIndex={0}
            aria-label="Zoom out"
            className="h-3.5 w-3.5 text-gold-500 hover:text-gold-300 cursor-pointer transition-colors"
          />
          <span className="text-[11px] text-gold-400 w-10 text-center select-none">{Math.round(scale * 100)}%</span>
          <Plus
            onClick={() => setScale(s => Math.min(2.5, +(s + 0.1).toFixed(2)))}
            role="button"
            tabIndex={0}
            aria-label="Zoom in"
            className="h-3.5 w-3.5 text-gold-500 hover:text-gold-300 cursor-pointer transition-colors"
          />
        </div>
      </div>

      <Document
        file={url}
        suspense={false}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<p className="text-gold-600 text-sm p-6">Loading…</p>}
        error={<p className="text-red-400 text-sm p-6">Failed to load PDF.</p>}
        className="flex-1 min-h-0 flex"
      >
        <div className="w-28 shrink-0 border-r border-gold-500/20 overflow-y-auto flex flex-col items-center gap-3 p-3">
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              onClick={() => scrollToPage(i + 1)}
              className="relative w-24 h-32 shrink-0 cursor-pointer rounded border border-gold-500/20 hover:border-gold-500/50 overflow-hidden transition-colors"
            >
              <Thumbnail
                pageNumber={i + 1}
                width={200}
                suspense={false}
                loading=""
                className="absolute inset-0 flex items-center justify-center [&_canvas]:w-full! [&_canvas]:h-full! [&_canvas]:object-cover"
              />
            </div>
          ))}
        </div>

        <div ref={pagesContainerRef} className="flex-1 overflow-y-auto px-10 py-6">
          <div className="flex flex-col items-center gap-6">
            {Array.from({ length: numPages }, (_, i) => (
              <div key={i} ref={el => { pageRefs.current[i] = el; }}>
                <Page
                  pageNumber={i + 1}
                  width={pageWidth * scale}
                  suspense={false}
                  renderAnnotationLayer={false}
                  className="shadow-2xl"
                />
              </div>
            ))}
          </div>
        </div>
      </Document>
    </div>
  );
}
