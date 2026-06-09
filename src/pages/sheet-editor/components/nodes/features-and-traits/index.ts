import React from "react";
import { Sparkles } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createFeaturesAndTraitsNode } from "../../../types";
import { FeaturesAndTraitsPreview } from "./Preview";
import { FeaturesAndTraitsSettingsForm } from "./Settings";

export const featuresAndTraitsNode: Record<string, NodeTypeConfig> = {
  "features-and-traits": {
    icon: React.createElement(Sparkles, { className: "h-3.5 w-3.5" }),
    label: "Features & Traits",
    allowedChildren: [],
    factory: createFeaturesAndTraitsNode,
    Preview: FeaturesAndTraitsPreview,
    Settings: FeaturesAndTraitsSettingsForm,
  },
};
