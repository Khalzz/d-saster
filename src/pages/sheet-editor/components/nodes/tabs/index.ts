import React from "react";
import { PanelTop, Square } from "lucide-react";
import type { NodeTypeConfig } from "../../../types";
import { createTabsNode, createTabPaneNode } from "../../../types";
import { TabsPreview } from "./TabsPreview";
import { TabsSettingsForm } from "./TabsSettings";
import { TabPanePreview } from "./TabPanePreview";
import { TabPaneSettingsForm } from "./TabPaneSettings";

const ALL_CHILDREN = ["container", "section", "image", "text-input", "level-count", "counter", "static-counter", "class-selector", "grid", "stat", "auto-stats", "auto-skills", "auto-saving-throws", "proficiency-bonus", "specie", "features-and-traits", "tabs"];

export const tabsNode: Record<string, NodeTypeConfig> = {
  "tabs": {
    icon: React.createElement(PanelTop, { className: "h-3.5 w-3.5" }),
    label: "Tabs",
    allowedChildren: ["tab-pane"],
    factory: createTabsNode,
    Preview: TabsPreview,
    Settings: TabsSettingsForm,
  },
  "tab-pane": {
    icon: React.createElement(Square, { className: "h-3.5 w-3.5" }),
    label: "Tab Pane",
    allowedChildren: ALL_CHILDREN,
    factory: () => createTabPaneNode("New Tab"),
    Preview: TabPanePreview,
    Settings: TabPaneSettingsForm,
  },
};
