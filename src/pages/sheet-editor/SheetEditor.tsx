import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast";
import Modal from "../../components/ui/modal/Modal";
import type { LayoutNode } from "./types";
import { FormEditor } from "./components/FormEditor";
import { sectionNode } from "./components/nodes/section";
import { imageNode } from "./components/nodes/image";
import { textInputNode } from "./components/nodes/text-input";
import { levelCountNode } from "./components/nodes/level-count";
import { counterNode } from "./components/nodes/counter";
import { staticCounterNode } from "./components/nodes/static-counter";
import { classSelectorNode } from "./components/nodes/class-selector";
import { gridNode } from "./components/nodes/grid";
import { autoStatsNode } from "./components/nodes/auto-stats";
import { autoSkillsNode } from "./components/nodes/auto-skills";
import { autoSavingThrowsNode } from "./components/nodes/auto-saving-throws";
import { proficiencyBonusNode } from "./components/nodes/proficiency-bonus";

const SHEET_ID = "default";

const nodeTypes = { ...sectionNode, ...imageNode, ...textInputNode, ...levelCountNode, ...counterNode, ...staticCounterNode, ...classSelectorNode, ...gridNode, ...autoStatsNode, ...autoSkillsNode, ...autoSavingThrowsNode, ...proficiencyBonusNode };

interface SheetData {
  id: string;
  name: string;
  nodes: LayoutNode[];
}

export default function SheetEditor() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<LayoutNode[]>([]);
  const [sheetName, setSheetName] = useState("My Sheet");
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const savedSnapshot = useRef<string>("");

  useEffect(() => {
    invoke<SheetData | null>("load_sheet", { id: SHEET_ID })
      .then((data) => {
        if (data) {
          setNodes(data.nodes ?? []);
          setSheetName(data.name ?? "My Sheet");
          savedSnapshot.current = JSON.stringify(data.nodes ?? []);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) {
      setDirty(JSON.stringify(nodes) !== savedSnapshot.current);
    }
  }, [nodes, loaded]);

  const handleSave = () => {
    const data: SheetData = { id: SHEET_ID, name: sheetName, nodes };
    invoke("save_sheet", { id: SHEET_ID, data })
      .then(() => {
        savedSnapshot.current = JSON.stringify(nodes);
        setDirty(false);
        toast.success("Sheet saved!");
      })
      .catch(() => toast.error("Failed to save sheet"));
  };

  const handleBack = () => {
    if (dirty) {
      setShowUnsavedModal(true);
    } else {
      navigate(-1);
    }
  };

  if (!loaded) {
    return (
      <main className="h-screen flex items-center justify-center bg-base">
        <span className="text-gold-600 text-xs">Loading...</span>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-base overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold-500/20 shrink-0">
        <button
          className="w-9! h-9! flex items-center justify-center"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-gold-400 font-semibold text-sm flex-1">
          Sheet Editor
        </h1>
        <button
          className="h-9! px-4! text-xs! gap-1.5! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400! hover:border-gold-400!"
          onClick={handleSave}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </div>
      <FormEditor
        nodes={nodes}
        onChange={setNodes}
        nodeTypes={nodeTypes}
      />

      {/* Unsaved changes modal */}
      <Modal isOpen={showUnsavedModal} onClose={() => setShowUnsavedModal(false)}>
        <div className="bg-surface border border-gold-500/20 rounded-xl p-6 flex flex-col gap-4 min-w-[320px]">
          <h2 className="text-gold-300 font-semibold text-sm">Unsaved Changes</h2>
          <p className="text-gold-600 text-xs">You have unsaved changes. Do you want to save before leaving?</p>
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              className="px-3! py-1.5! text-xs! border-gold-500/30! text-gold-500! hover:bg-gold-500/10!"
              onClick={() => {
                setShowUnsavedModal(false);
                navigate(-1);
              }}
            >
              Discard
            </button>
            <button
              type="button"
              className="px-3! py-1.5! text-xs! bg-gold-500! text-gray-900! border-gold-500! hover:bg-gold-400!"
              onClick={() => {
                const data: SheetData = { id: SHEET_ID, name: sheetName, nodes };
                invoke("save_sheet", { id: SHEET_ID, data })
                  .then(() => {
                    toast.success("Sheet saved!");
                    navigate(-1);
                  })
                  .catch(() => toast.error("Failed to save sheet"));
                setShowUnsavedModal(false);
              }}
            >
              Save & Leave
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
