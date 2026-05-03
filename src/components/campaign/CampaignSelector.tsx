import Button from "../ui/buttons/BaseButton";
import Badge from "../ui/badge/Badge";

// Title
// Description

export default function CampaignSelectable({ campaign }: { campaign: { title: string, description: string, tags: string[] } }) {
  return (
    <Button className="w-full h-fit text-left flex flex-col gap-2 items-start! p-4" onClick={() => alert(`${campaign.title} selected`)}>
      <div className="text-left">
        <p className="font-bold">{campaign.title}</p>
        <p>{campaign.description}</p>
      </div>
    </Button>
  );
}