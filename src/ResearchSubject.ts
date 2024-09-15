import {
  capitalize,
  createRawJSON,
  expandPrices,
  expandExotics,
  getLocalizedText,
  getRawFiles,
} from "./util";

// Unmanipulated research subject JSON objects.
const rawResearchSubjectsJSON = createRawJSON(getRawFiles(".research_subject"));

// Most of our data manipulation will be done on this object.
let researchSubjectsJSON: any = { ...rawResearchSubjectsJSON };

// Filter out irrelevant fields.
for (const researchSubject in researchSubjectsJSON) {
  const {
    version,
    field_coord,
    name_uppercase,
    hud_icon,
    tooltip_picture,
    extra_text_filter_strings,
    ...relevantFields
  }: any = researchSubjectsJSON[researchSubject];
  researchSubjectsJSON[researchSubject] = { ...relevantFields };
}

// Expand credit, metal, and crystal cost (replaces "price" field with credits, metal, and crystal fields).
researchSubjectsJSON = expandPrices(researchSubjectsJSON);

// Expand exotics cost (finds "exotics" and "exotic_price" arrays and extracts the prices).
// Actually, there might be a difference between "exotics" and "exotic_price". Need to verify.
researchSubjectsJSON = expandExotics(researchSubjectsJSON);

// Normalize research tier and field
// Example: {domain: 'military', tier: 2, domain: 'military_assault"} becomes {tier: Military 2, domain: Assault}.
for (const researchSubject in researchSubjectsJSON) {
  const { domain, tier, field, ...otherFields }: any =
    researchSubjectsJSON[researchSubject];
  const normalizedTier = `${capitalize(domain)} ${tier}`;
  const normalizedField = capitalize(field.split("_")[1]);
  researchSubjectsJSON[researchSubject] = {
    ...otherFields,
    tier: normalizedTier,
    field: normalizedField,
  };
}

// Find localized text for name and description.
// Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
for (const researchSubject in researchSubjectsJSON) {
  const { name, description, ...otherFields }: any =
    researchSubjectsJSON[researchSubject];
  const localizedName = getLocalizedText(name);
  const localizedDescription = description ? getLocalizedText(description) : "";
  researchSubjectsJSON[researchSubject] = {
    name: localizedName,
    description: localizedDescription,
    ...otherFields,
  };
}

// Find localized text for prerequisites. This section assumes that the names have already been localized.
for (const researchSubject in researchSubjectsJSON) {
  const { prerequisites, ...otherFields }: any =
    researchSubjectsJSON[researchSubject];
  const localizedPrerequisites = prerequisites
    ? [
        ...prerequisites[0].map((prerequiste: string) => {
          return researchSubjectsJSON[prerequiste].name;
        }),
      ]
    : [];
  researchSubjectsJSON[researchSubject] = {
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
  for (const researchSubject in researchSubjectsJSON) {
    const {
      name,
      description,
      tier,
      field,
      research_time,
      ...otherFields
    }: any = researchSubjectsJSON[researchSubject];
    const id: string = researchSubject;
    let race: string = capitalize(researchSubject.split("_")[0]);
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
