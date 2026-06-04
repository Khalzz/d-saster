import React from "react";
import { Hash } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createStaticCounterNode } from "../../../types";
import { StaticCounterPreview } from "./Preview";
import { StaticCounterSettingsForm } from "./Settings";

export const staticCounterNode: Record<string, NodeTypeConfig> = {
  "static-counter": {
    icon: React.createElement(Hash, { className: "h-3.5 w-3.5" }),
    label: "Static Counter",
    allowedChildren: [],
    factory: createStaticCounterNode,
    Preview: StaticCounterPreview,
    Settings: StaticCounterSettingsForm,
  },
};
