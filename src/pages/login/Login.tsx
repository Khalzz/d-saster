import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/buttons/BaseButton";
import Card from "../../components/ui/card/card";

export default function Login() {
  const navigate = useNavigate();

  return (
    <main className="h-full min-w-screen bg-base flex justify-center items-center">
      <Card className="w-60 space-y-4">
        <p className="w-full text-center bold">Login</p>
        <div className="space-y-2">
          <button className="w-full text-center" onClick={() => navigate("/campaign")}>
            Enter as DM
          </button>
          <button className="w-full text-center" onClick={() => navigate("/play")}>
            Enter as Player
          </button>
        </div>

      </Card>
    </main>
  );
}