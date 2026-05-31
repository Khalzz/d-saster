import type { NodeTypeConfig } from "../../types";
import { createContainerNode } from "../../types";

import { ContainerPreview } from "./container/Preview";
import { ContainerSettingsForm } from "./container/Settings";

import { Box } from "lucide-react";
import React from "react";

// ── Core node types (built into FormEditor) ────────────────────────────────
// These are always available — they are the layout primitives.

export const coreNodeTypes: Record<string, NodeTypeConfig> = {
  container: {
    icon: React.createElement(Box, { className: "h-3.5 w-3.5" }),
    label: "Container",
    allowedChildren: ["container"],
    factory: createContainerNode,
    Preview: ContainerPreview,
    Settings: ContainerSettingsForm,
  },
};
