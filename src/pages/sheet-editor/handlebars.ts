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

/** Replace all {{var}} tokens with their raw string representation (for text/display contexts). */
export function resolveHandlebars(formula: string, vars: Record<string, string | number>): string {
  return formula.replace(/\{\{([\w.]+)\}\}/g, (_, key) => key in vars ? String(vars[key]) : "0");
}

/**
 * Resolve {{var}} tokens and evaluate the result as a JS expression.
 * String values are JSON-quoted so they survive JS evaluation intact
 * (e.g. "+3" stays "+3" instead of becoming 3).
 * Returns the evaluated result as a string, or the resolved template on error.
 */
export function evalFormula(formula: string, vars: Record<string, string | number>): string {
  const resolved = formula.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    if (!(key in vars)) return "0";
    const v = vars[key];
    return typeof v === "string" ? JSON.stringify(v) : String(v);
  });
  try {
    return String(Function(`"use strict"; return (${resolved})`)());
  } catch {
    // Strip surrounding quotes if the resolved value was a plain string literal
    return resolved.replace(/^"(.*)"$/s, "$1");
  }
}
