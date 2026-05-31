import React from "react";
import { Dices } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createAutoStatsNode } from "../../../types";
import { AutoStatsPreview } from "./Preview";
import { AutoStatsSettingsForm } from "./Settings";

export const autoStatsNode: Record<string, NodeTypeConfig> = {
  "auto-stats": {
    icon: React.createElement(Dices, { className: "h-3.5 w-3.5" }),
    label: "Stats (Auto)",
    allowedChildren: [],
    factory: createAutoStatsNode,
    Preview: AutoStatsPreview,
    Settings: AutoStatsSettingsForm,
  },
};
