import { Document, Page, Thumbnail, pdfjs } from "react-pdf";

// Must be set in the same module where Document/Page/Thumbnail are used
// (see react-pdf docs) - every consumer imports those from here instead
// of "react-pdf" directly so this runs first.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export { Document, Page, Thumbnail };
