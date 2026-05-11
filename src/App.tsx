import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Play from "./pages/play/Play";
import CampaignSelection from "./pages/campaign/Campaign";
import Login from "./pages/login/Login";
import SceneEditor from "./pages/scene/scene-editor";
import CharacterEditor from "./pages/character/character-editor";
import RulesetEditor from "./pages/ruleset/ruleset-editor";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/play" element={<Play />} />
        <Route path="/campaign" element={<CampaignSelection />} />
        <Route path="/scene-editor" element={<SceneEditor />} />
        <Route path="/character-editor" element={<CharacterEditor />} />
        <Route path="/ruleset-editor" element={<RulesetEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
