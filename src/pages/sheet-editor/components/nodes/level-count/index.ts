import React from "react";
import { Hash } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createLevelCountNode } from "../../../types";
import { LevelCountPreview } from "./Preview";
import { LevelCountSettingsForm } from "./Settings";

export const levelCountNode: Record<string, NodeTypeConfig> = {
  "level-count": {
    icon: React.createElement(Hash, { className: "h-3.5 w-3.5" }),
    label: "Level Count",
    allowedChildren: [],
    factory: createLevelCountNode,
    Preview: LevelCountPreview,
    Settings: LevelCountSettingsForm,
  },
};
