import type { SheetContext } from "../../../../pages/character/components/CharacterSheetView";

const mockChar: SheetContext["char"] = {
  id: "",
  name: "Character Name",
  description: "",
  origin: "",
  race: "",
  type: "player",
  stats: {},
  savingThrows: {},
  savingThrowProficiencies: {},
  skillProficiencies: {},
  inspiration: 0,
  proficiencyBonus: 3,
  level: 5,
  armorClass: 10,
  initiative: 2,
  speed: 30,
  customFields: {},
};

const mockContext: SheetContext = {
  char: mockChar,
  onChange: () => {},
  ruleset: undefined,
  statDefs: [],
  skills: [],
  classes: [],
  vars: { level: 5, proficiency_bonus: 3, name: "Character Name" },
};

export function useMockSheet(): SheetContext { return mockContext; }
