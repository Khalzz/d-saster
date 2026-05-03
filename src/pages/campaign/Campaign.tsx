import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/buttons/BaseButton";
import Card from "../../components/ui/card/card";
import Input from "../../components/ui/input/Input";
import Header from "../../components/ui/header/Header";
import CampaignSelectable from "../../components/campaign/CampaignSelector";
import { ChevronLeft, Plus } from "lucide-react";
import Modal from "../../components/ui/modal/Modal";
import { MenuItem } from "@tauri-apps/api/menu";

export default function CampaignSelection() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");

  const navigate = useNavigate();
  const campaigns = [
    {
      title: "Adventures of the borderlands",
      description: "A bunch of adventurers find themselves on a path on the border between 2 reigns in war, some may think they work for one side, others for the other.",
      tags: ["Medieval", "Magic", "Tolkien-like"]
    },
    {
      title: "Houses of the fallen",
      description: "A house filled with fallen souls from a forgotten war, it's your job to find out what happened and why they are there.",
      tags: ["Dark", "Magic", "Scary"]
    }
  ]

  return (
    <main className="h-full min-w-screen bg-base flex flex-col justify-center items-center">
      <div className="flex flex-col min-w-2xl h-full py-6 gap-2">
        <div className="flex flex-row gap-2">
          <Button onClick={() => navigate("/")}>
            <ChevronLeft/>
          </Button>
          <Input value={search} onChange={setSearch} placeholder="Search campaigns..." />
          <Button className="w-fit" onClick={() => setIsModalOpen(true)}>
            <Plus/>
          </Button>
        </div>
        <Card className={`w-60 space-y-4 h-full min-w-2xl overflow-auto ${campaigns.length === 0 ? "flex items-center justify-center" : ""}`}>
          <div className="space-y-2">
            {
              campaigns.length > 0 ? campaigns.map((campaign, index) => (
                <CampaignSelectable key={index} campaign={campaign} />
              )) : <p className="text-gold-dark">No campaigns found</p>
            }
          </div>
        </Card>
      </div>  
      <Modal isOpen={isModalOpen} className="">
        <div className="flex flex-col gap-4 min-w-80">
          <div className="flex flex-col gap-1">
            <h2 className="text-gold font-bold text-lg">New Campaign</h2>
            <p className="text-gold-dark text-sm">Fill in the details to start your adventure.</p>
          </div>
          <form className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-gold text-sm font-medium">Title</label>
              <Input value={campaignName} onChange={setCampaignName} placeholder="The lost kingdom..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gold text-sm font-medium">Description</label>
              <Input value={campaignName} onChange={setCampaignName} placeholder="A brief summary of your campaign..." />
            </div>
            <div className="flex flex-row gap-2 w-full pt-2">
              <Button className="w-full text-center" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button className="w-full text-center bg-gold-500! text-gold-900! hover:bg-gold-400!" onClick={() => setIsModalOpen(false)}>
                Create
              </Button>
            </div>
          </form>
        </div>
      </Modal>      
    </main>
  );
}