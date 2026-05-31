import React from "react";
import { BookOpen } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createAutoSkillsNode } from "../../../types";
import { AutoSkillsPreview } from "./Preview";
import { AutoSkillsSettingsForm } from "./Settings";

export const autoSkillsNode: Record<string, NodeTypeConfig> = {
  "auto-skills": {
    icon: React.createElement(BookOpen, { className: "h-3.5 w-3.5" }),
    label: "Skills (Auto)",
    allowedChildren: [],
    factory: createAutoSkillsNode,
    Preview: AutoSkillsPreview,
    Settings: AutoSkillsSettingsForm,
  },
};
