import React from "react";
import { ImageIcon } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createImageNode } from "../../../types";
import { ImagePreview } from "./Preview";
import { ImageSettingsForm } from "./Settings";

export const imageNode: Record<string, NodeTypeConfig> = {
  image: {
    icon: React.createElement(ImageIcon, { className: "h-3.5 w-3.5" }),
    label: "Image",
    allowedChildren: [],
    factory: createImageNode,
    Preview: ImagePreview,
    Settings: ImageSettingsForm,
  },
};
