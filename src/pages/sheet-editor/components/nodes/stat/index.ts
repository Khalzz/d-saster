import React from "react";
import { Dices } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createStatNode } from "../../../types";
import { StatPreview } from "./Preview";
import { StatSettingsForm } from "./Settings";

export const statNode: Record<string, NodeTypeConfig> = {
  stat: {
    icon: React.createElement(Dices, { className: "h-3.5 w-3.5" }),
    label: "Stat",
    allowedChildren: [],
    factory: createStatNode,
    Preview: StatPreview,
    Settings: StatSettingsForm,
  },
};
