import React from "react";
import { TextCursorInput } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createTextInputNode } from "../../../types";
import { TextInputPreview } from "./Preview";
import { TextInputSettingsForm } from "./Settings";

export const textInputNode: Record<string, NodeTypeConfig> = {
  "text-input": {
    icon: React.createElement(TextCursorInput, { className: "h-3.5 w-3.5" }),
    label: "Text Input",
    allowedChildren: [],
    factory: createTextInputNode,
    Preview: TextInputPreview,
    Settings: TextInputSettingsForm,
  },
};
