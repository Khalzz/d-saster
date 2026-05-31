import React from "react";
import { Grid3X3 } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createGridNode } from "../../../types";
import { GridPreview } from "./Preview";
import { GridSettingsForm } from "./Settings";

export const gridNode: Record<string, NodeTypeConfig> = {
  grid: {
    icon: React.createElement(Grid3X3, { className: "h-3.5 w-3.5" }),
    label: "Grid",
    allowedChildren: ["container", "section", "image", "text-input", "level-count", "class-selector", "grid", "stat", "auto-stats", "auto-skills"],
    factory: createGridNode,
    Preview: GridPreview,
    Settings: GridSettingsForm,
  },
};
