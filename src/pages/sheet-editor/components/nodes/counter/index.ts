import React from "react";
import { Hash } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createCounterNode } from "../../../types";
import { CounterPreview } from "./Preview";
import { CounterSettingsForm } from "./Settings";

export const counterNode: Record<string, NodeTypeConfig> = {
  counter: {
    icon: React.createElement(Hash, { className: "h-3.5 w-3.5" }),
    label: "Counter",
    allowedChildren: [],
    factory: createCounterNode,
    Preview: CounterPreview,
    Settings: CounterSettingsForm,
  },
};
