import React from "react";
import { Circle } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createProficiencyBonusNode } from "../../../types";
import { ProficiencyBonusPreview } from "./Preview";
import { ProficiencyBonusSettingsForm } from "./Settings";

export const proficiencyBonusNode: Record<string, NodeTypeConfig> = {
  "proficiency-bonus": {
    icon: React.createElement(Circle, { className: "h-3.5 w-3.5" }),
    label: "Proficiency Bonus",
    allowedChildren: [],
    factory: createProficiencyBonusNode,
    Preview: ProficiencyBonusPreview,
    Settings: ProficiencyBonusSettingsForm,
  },
};
