import type { LayoutNode, VarDef } from "./types";

/** Convert a node label to a handlebar variable key: "Hit Points" → "hit_points" */
export function labelToVar(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Walk a node tree and collect only the variables that actually exist as nodes
 * on the sheet — level-count → {{level}}, counter/text-input → {{label_key}}, etc.
 */
export function collectSheetVars(nodes: LayoutNode[]): VarDef[] {
  const seen = new Set<string>();
  const vars: VarDef[] = [];

  const add = (key: string, description: string) => {
    if (key && !seen.has(key)) { seen.add(key); vars.push({ key, description }); }
  };

  const walk = (ns: LayoutNode[]) => {
    for (const n of ns) {
      switch (n.type) {
        case "level-count":
          add("level", "Character level");
          break;
        case "proficiency-bonus":
          add("proficiency_bonus", "Proficiency bonus");
          break;
        case "counter": {
          const label = (n.settings as { label?: string }).label ?? "";
          const key = labelToVar(label);
          add(key, `"${label}" counter value`);
          break;
        }
        case "text-input": {
          const label = (n.settings as { label?: string }).label ?? "";
          const key = labelToVar(label);
          add(key, `"${label}" text value`);
          break;
        }
      }
      walk(n.children);
    }
  };
  walk(nodes);
  return vars;
}

/** Replace all {{var}} and {{namespace.key}} tokens in a formula string with values from the vars map */
export function resolveHandlebars(formula: string, vars: Record<string, string | number>): string {
  return formula.replace(/\{\{([\w.]+)\}\}/g, (_, key) => key in vars ? String(vars[key]) : "0");
}
