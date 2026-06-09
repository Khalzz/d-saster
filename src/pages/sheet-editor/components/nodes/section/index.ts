import React from "react";
import { LayoutPanelTop } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createSectionNode } from "../../../types";
import { SectionPreview } from "./Preview";
import { SectionSettingsForm } from "./Settings";

export const sectionNode: Record<string, NodeTypeConfig> = {
  section: {
    icon: React.createElement(LayoutPanelTop, { className: "h-3.5 w-3.5" }),
    label: "Section",
    allowedChildren: ["container", "section", "image", "text-input", "level-count", "counter", "static-counter", "class-selector", "grid", "stat", "auto-stats", "auto-skills", "specie", "features-and-traits"],
    factory: createSectionNode,
    Preview: SectionPreview,
    Settings: SectionSettingsForm,
  },
};
