import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Star } from "lucide-react";
import type { AutoSkillsSettings } from "../../../types";
import type { NodePreviewProps } from "../types";
import type { Ruleset, RulesetSkill, StatDefinition } from "../../../../ruleset/ruleset-editor";

export function AutoSkillsPreview({ node, selectedIds, onSelect }: NodePreviewProps) {
  const { columns, padding, gap, width } = node.settings as AutoSkillsSettings;
  const isSelected = selectedIds.has(node.id);
  const [skills, setSkills] = useState<RulesetSkill[]>([]);
  const [statDefs, setStatDefs] = useState<StatDefinition[]>([]);

  useEffect(() => {
    invoke<Ruleset[]>("list_rulesets")
      .then((rulesets) => {
        const allSkills: RulesetSkill[] = [];
        const allStats: StatDefinition[] = [];
        for (const rs of rulesets) {
          for (const skill of rs.skills) {
            if (!allSkills.some((s) => s.id === skill.id)) {
              allSkills.push(skill);
            }
          }
          for (const stat of rs.stats) {
            if (!allStats.some((s) => s.key === stat.key)) {
              allStats.push(stat);
            }
          }
        }
        setSkills(allSkills);
        setStatDefs(allStats);
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className={`transition-colors cursor-pointer ${
        isSelected ? "outline-1 outline-offset-4 outline-gold-400" : ""
      }`}
      style={{ padding, ...(width > 0 ? { width: `${width}%` } : { width: '100%' }) }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}
      >
        {skills.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-3">
            <span className="text-gold-700 text-[9px] font-medium uppercase tracking-wider select-none">
              No skills in ruleset
            </span>
          </div>
        ) : (
          skills.map((skill) => {
            const statDef = statDefs.find((d) => d.key === skill.statKey);
            return (
              <div
                key={skill.id}
                className="flex items-center gap-2 border border-gold-500/20 rounded-lg px-2 py-1 select-none justify-between"
              >
                <div className="flex items-center gap-1 min-w-0">
                  <Star className="h-3 w-3 text-gold-700 shrink-0" />
                  <span className="text-gold-300 text-xs truncate">{skill.name || "—"}</span>
                  <span className="text-gold-600 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    ({(statDef?.label ?? skill.statKey).slice(0, 3).toUpperCase()})
                  </span>
                </div>
                <span className="text-gold-500 text-xs font-semibold shrink-0">+0</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
