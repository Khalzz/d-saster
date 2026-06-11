import type { Dispatch, SetStateAction } from "react";
import { SectionHeader } from "../section-header";
import type { Ruleset } from "../../../../../pages/ruleset/ruleset-editor";
import Field from "../../../Field";
import { SectionBody } from "../section-body";

export function GeneralSection({ ruleset, setRuleset }: {
  ruleset: Ruleset;
  setRuleset: Dispatch<SetStateAction<Ruleset>>;
}) {  
 {/* ── General ── */}
  return (<>
    <SectionHeader title="General" />
    <SectionBody>
      <Field label="Name">
        <input value={ruleset.name} onChange={e => setRuleset(r => ({ ...r, name: e.target.value }))} placeholder="D&D 5e, Anima, Pathfinder…" />
      </Field>
      <Field label="Description">
        <textarea rows={4} value={ruleset.description} onChange={e => setRuleset(r => ({ ...r, description: e.target.value }))} placeholder="Briefly describe this ruleset…" />
      </Field>
    </SectionBody>
  </>);
}