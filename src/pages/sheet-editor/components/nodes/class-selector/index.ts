import React from "react";
import { Swords } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createClassSelectorNode } from "../../../types";
import { ClassSelectorPreview } from "./Preview";
import { ClassSelectorSettingsForm } from "./Settings";

export const classSelectorNode: Record<string, NodeTypeConfig> = {
  "class-selector": {
    icon: React.createElement(Swords, { className: "h-3.5 w-3.5" }),
    label: "Class Selector",
    allowedChildren: [],
    factory: createClassSelectorNode,
    Preview: ClassSelectorPreview,
    Settings: ClassSelectorSettingsForm,
  },
};
