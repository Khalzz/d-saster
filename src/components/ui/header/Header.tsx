import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header({ title, backTo }: { title: string; backTo?: string }) {
  const navigate = useNavigate();

  return (
    <div className="bg-gold border-bottom h-12 w-full flex items-center justify-start px-2 gap-2">
      {backTo && <ChevronLeft className="text-gray-800 hover:text-gray-700 cursor-pointer" onClick={() => navigate(backTo)} />}
      <p className="text-gray-800 text-center font-medium">{title}</p>
    </div>
  );
}
