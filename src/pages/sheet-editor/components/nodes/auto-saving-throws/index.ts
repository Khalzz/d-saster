import React from "react";
import { Shield } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createAutoSavingThrowsNode } from "../../../types";
import { AutoSavingThrowsPreview } from "./Preview";
import { AutoSavingThrowsSettingsForm } from "./Settings";

export const autoSavingThrowsNode: Record<string, NodeTypeConfig> = {
  "auto-saving-throws": {
    icon: React.createElement(Shield, { className: "h-3.5 w-3.5" }),
    label: "Saving Throws (Auto)",
    allowedChildren: [],
    factory: createAutoSavingThrowsNode,
    Preview: AutoSavingThrowsPreview,
    Settings: AutoSavingThrowsSettingsForm,
  },
};
