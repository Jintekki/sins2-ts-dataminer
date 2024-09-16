import {
  capitalize,
  createRawJSON,
  getAllCost,
  getLocalizedText,
  getRawFiles,
} from "../util";

// Unmanipulated research subject JSON objects.
const rawResearchSubjectsJSON = createRawJSON(getRawFiles(".research_subject"));

// Most of our data manipulation will be done on this object.
let researchSubjectsJSON: any = { ...rawResearchSubjectsJSON };

// Filter out irrelevant fields.
for (const researchSubjectKey in researchSubjectsJSON) {
  const {
    version,
    field_coord,
    name_uppercase,
    hud_icon,
    tooltip_picture,
    extra_text_filter_strings,
    tooltip_icon,
    ...relevantFields
  }: any = researchSubjectsJSON[researchSubjectKey];
  researchSubjectsJSON[researchSubjectKey] = { ...relevantFields };
}

// Expand credit, metal, and crystal, and individual exotics cost (replaces "price" and "exotic_price")
researchSubjectsJSON = { ...getAllCost(researchSubjectsJSON) };

// Normalize research tier and field
// Example: {domain: 'military', tier: 2, domain: 'military_assault"} becomes {tier: Military 2, domain: Assault}.
for (const researchSubjectKey in researchSubjectsJSON) {
  const { domain, tier, field, ...otherFields }: any =
    researchSubjectsJSON[researchSubjectKey];
  const normalizedTier = `${capitalize(domain)} ${tier}`;
  const normalizedField = capitalize(field.split("_")[1]);
  researchSubjectsJSON[researchSubjectKey] = {
    ...otherFields,
    tier: normalizedTier,
    field: normalizedField,
  };
}

// Find localized text for name and description.
// Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
for (const researchSubjectKey in researchSubjectsJSON) {
  const { name, description, ...otherFields }: any =
    researchSubjectsJSON[researchSubjectKey];
  const localizedName = getLocalizedText(name);
  const localizedDescription = description ? getLocalizedText(description) : "";
  researchSubjectsJSON[researchSubjectKey] = {
    name: localizedName,
    description: localizedDescription,
    ...otherFields,
  };
}

// Find localized text for prerequisites. This section assumes that the names have already been localized.
for (const researchSubjectKey in researchSubjectsJSON) {
  const { prerequisites, ...otherFields }: any =
    researchSubjectsJSON[researchSubjectKey];
  const localizedPrerequisites = prerequisites
    ? [
        ...prerequisites[0].map((prerequiste: string) => {
          return researchSubjectsJSON[prerequiste].name;
        }),
      ]
    : [];
  researchSubjectsJSON[researchSubjectKey] = {
    prerequisites: localizedPrerequisites,
    ...otherFields,
  };
}

// Final adjustments for readability. Adds race field, more human readable key, id, and re-orders fields.
// Also replaces "Trader" with "TEC"
const prettifiedResearchSubjectsJSON: any =
  createPrettifiedResarchSubjectsJSON(researchSubjectsJSON);

function createPrettifiedResarchSubjectsJSON(researchSubjectsJSON: any) {
  let prettifiedResearchSubjectsJSON: any = {};
  for (const researchSubjectKey in researchSubjectsJSON) {
    const {
      name,
      description,
      tier,
      field,
      research_time,
      ...otherFields
    }: any = researchSubjectsJSON[researchSubjectKey];
    const id: string = researchSubjectKey;
    let race: string = capitalize(researchSubjectKey.split("_")[0]);
    race = race === "Trader" ? "TEC" : race;
    const key: string = `${race} ${name}`;
    prettifiedResearchSubjectsJSON[key] = {
      id,
      name,
      description,
      tier,
      field,
      research_time,
      race,
      ...otherFields,
    };
  }
  return prettifiedResearchSubjectsJSON;
}

export function getRawResearchSubjects() {
  return JSON.stringify(rawResearchSubjectsJSON, null, 2);
}

export default function getResearchSubjects() {
  return JSON.stringify(prettifiedResearchSubjectsJSON, null, 2);
}
