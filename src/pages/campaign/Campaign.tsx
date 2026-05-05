import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import Input from "../../components/ui/input/Input";
import CampaignCard, { Campaign, ColorPicker } from "../../components/campaign/CampaignSelector";
import { ChevronLeft, ImagePlus, Plus, Trash2, X } from "lucide-react";
import Modal from "../../components/ui/modal/Modal";

export default function CampaignSelection() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#1a2d1f");
  const [newImage, setNewImage] = useState<string | undefined>();
  const imgInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    invoke<Campaign[]>("list_campaigns").then(setCampaigns).catch(() => {});
  }, []);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      tags: [],
      color: newColor,
      image: newImage,
    };
    invoke("save_campaign", { campaign }).catch(() => {});
    setCampaigns(prev => [...prev, campaign]);
    setNewTitle("");
    setNewDescription("");
    setNewColor("#1a2d1f");
    setNewImage(undefined);
    setIsModalOpen(false);
  };

  const filtered = campaigns.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="h-full min-w-screen bg-base flex flex-col items-center">
      <div className="flex flex-col w-full max-w-5xl h-full py-8 px-6 gap-6">
        <div className="flex flex-row gap-3 items-center">
          <button onClick={() => navigate("/")}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Input value={search} onChange={setSearch} placeholder="Search campaigns..." className="flex-1" />
          <button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(224px,1fr))] gap-5">
            {filtered.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => navigate("/play", { state: { campaign } })}
                onDelete={() => setPendingDelete(campaign)}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gold-700">
            No campaigns found
          </div>
        )}
      </div>

      <Modal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)}>
        <div className="bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 p-6 w-80 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Trash2 size={20} className="text-[#ef4444]" />
            <span className="text-gold-400 font-medium">Delete Campaign</span>
          </div>
          <p className="text-gold-500 text-sm">
            Are you sure you want to delete <span className="text-gold-300 font-medium">"{pendingDelete?.title}"</span>? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button className="text-sm px-4!" onClick={() => setPendingDelete(null)}>Cancel</button>
            <button
              className="text-sm px-4! bg-red-500/10! border-[#ef4444]! text-[#ef4444]! hover:bg-red-500/40! hover:border-[#ef4444]!"
              onClick={() => {
                invoke("delete_campaign", { id: pendingDelete!.id }).catch(() => {});
                setCampaigns(prev => prev.filter(c => c.id !== pendingDelete!.id));
                setPendingDelete(null);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-surface border border-gold-500 rounded-xl shadow-lg shadow-gold-950/50 p-6 w-96 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-gold-400 font-bold text-lg">New Campaign</h2>
            <p className="text-gold-700 text-sm">Fill in the details to start your adventure.</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-gold-500 text-sm font-medium">Title</label>
              <Input value={newTitle} onChange={setNewTitle} placeholder="The lost kingdom..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gold-500 text-sm font-medium">Description</label>
              <Input value={newDescription} onChange={setNewDescription} placeholder="A brief summary of your campaign..." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gold-500 text-sm font-medium">Appearance</label>
              <ColorPicker value={newColor} onChange={(c) => { setNewColor(c); setNewImage(undefined); }} />
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              {newImage ? (
                <div className="flex items-center gap-2 mt-1">
                  <img src={newImage} alt="" className="w-20 h-12 object-cover rounded-md border border-gold-500/40" />
                  <button
                    type="button"
                    onClick={() => setNewImage(undefined)}
                    className="w-fit! h-fit! p-1! border-none! bg-transparent! text-gold-600 hover:text-gold-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imgInputRef.current?.click()}
                  className="mt-1 w-full! h-9! border-dashed! text-xs! text-gold-600! hover:text-gold-400! flex items-center gap-1.5"
                >
                  <ImagePlus size={13} /> Upload cover image
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-2 w-full pt-1">
            <button className="flex-1 text-center" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button
              className="flex-1 text-center bg-gold-500! text-gold-900! hover:bg-gold-400!"
              onClick={handleCreate}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
