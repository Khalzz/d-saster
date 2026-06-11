import Modal from "../../modal/Modal";

export function EditorModal({ title, saveLabel, onSave, onClose, children }: {
  title: string;
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="bg-surface border border-gold-500/20 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
          <h2 className="text-gold-300 font-semibold text-sm flex-1">{title}</h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {children}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gold-500/20 shrink-0">
          <button className="px-4! h-8! text-xs! border-gold-500/30! text-gold-500!" onClick={onClose}>Cancel</button>
          <button
            className="px-4! h-8! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
            onClick={onSave}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}