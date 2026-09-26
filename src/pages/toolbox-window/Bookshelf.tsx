import { useEffect, useRef, useState } from "react";
import { BookOpen, MoreVertical, Plus } from "lucide-react";
import { Dropdown, Option } from "../../components/ui/dropdown/Dropdown";
import { Document, Thumbnail } from "../../lib/pdf";
import PdfViewer from "./PdfViewer";

interface Book {
  id: string;
  name: string;
  format: "pdf";
  url: string;
  uploadedAt: number;
}

export default function Bookshelf() {
  const [books, setBooks] = useState<Book[]>([]);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep a live ref so the unmount-cleanup effect below always sees the
  // latest list, since its own closure only runs once on mount.
  const booksRef = useRef<Book[]>(books);
  useEffect(() => { booksRef.current = books; }, [books]);
  useEffect(() => () => { booksRef.current.forEach(b => URL.revokeObjectURL(b.url)); }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const book: Book = {
      id: crypto.randomUUID(),
      name: file.name.replace(/\.pdf$/i, ""),
      format: "pdf",
      url: URL.createObjectURL(file),
      uploadedAt: Date.now(),
    };
    setBooks(prev => [...prev, book]);
  };

  const removeBook = (id: string) => {
    setBooks(prev => {
      const book = prev.find(b => b.id === id);
      if (book) URL.revokeObjectURL(book.url);
      return prev.filter(b => b.id !== id);
    });
  };

  if (viewingBook) {
    return <PdfViewer name={viewingBook.name} url={viewingBook.url} onBack={() => setViewingBook(null)} />;
  }

  return (
    <div className="w-full h-full overflow-y-auto p-5">
      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFilePick} />

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload a book"
            className="w-full! h-full! aspect-2/3 rounded-xl border border-dashed border-gold-500/30 bg-surface/20 flex items-center justify-center text-gold-700 hover:border-gold-500/60 hover:text-gold-500 transition-colors"
          >
            <Plus className="" />
          </button>
          <div className="px-0.5 opacity-0 select-none pointer-events-none" aria-hidden="true">
            <p className="text-xs truncate">&nbsp;</p>
            <p className="text-[10px]">&nbsp;</p>
          </div>
        </div>

        {books.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onOpen={() => setViewingBook(book)}
            onRemove={() => removeBook(book.id)}
          />
        ))}
      </div>
    </div>
  );
}

function BookCard({ book, onOpen, onRemove }: {
  book: Book;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dateLabel = new Date(book.uploadedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div
        onDoubleClick={onOpen}
        className="group relative aspect-2/3 rounded-xl border border-transparent bg-surface/40 overflow-hidden flex items-center justify-center cursor-pointer transition-colors select-none hover:border-gold-500/40"
      >
        <Document
          file={book.url}
          suspense={false}
          loading={<BookOpen className="h-14 w-14 text-gold-700" />}
          error={<BookOpen className="h-14 w-14 text-gold-700" />}
          noData={<BookOpen className="h-14 w-14 text-gold-700" />}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Thumbnail
            pageNumber={1}
            width={260}
            suspense={false}
            loading=""
            className="[&_canvas]:w-full! [&_canvas]:h-full! [&_canvas]:object-cover"
          />
        </Document>

        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className={`p-1 rounded text-gold-500 bg-base/70 hover:text-gold-300 transition-opacity ${
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            title="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <Dropdown className="w-28">
              <Option onClick={() => { setMenuOpen(false); onOpen(); }}>Open</Option>
              <Option onClick={() => setMenuOpen(false)}>Rename</Option>
              <Option onClick={() => { setMenuOpen(false); onRemove(); }} className="text-red-300">Remove</Option>
            </Dropdown>
          )}
        </div>
      </div>

      <div className="px-0.5">
        <p className="text-xs text-gold-200 font-medium truncate">{book.name}</p>
        <p className="text-[10px] text-gold-700">{dateLabel}</p>
      </div>
    </div>
  );
}
