import React from "react";
import { Dna } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createSpecieNode } from "../../../types";
import { SpeciePreview } from "./Preview";
import { SpecieSettingsForm } from "./Settings";

export const specieNode: Record<string, NodeTypeConfig> = {
  specie: {
    icon: React.createElement(Dna, { className: "h-3.5 w-3.5" }),
    label: "Species",
    allowedChildren: [],
    factory: createSpecieNode,
    Preview: SpeciePreview,
    Settings: SpecieSettingsForm,
  },
};
