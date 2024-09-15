import fs from "fs";
import path from "path";
import {
  capitalize,
  getExoticAliasConversion,
  getExoticPrice,
  getLocalizedText,
} from "./util";

const entitiesFolder = `${process.env.PATH_TO_SINS2_FOLDER}\\entities`;

const rawResearchSubjectFiles = fs
  .readdirSync(entitiesFolder, {
    withFileTypes: true,
  })
  .filter((file: any) => {
    return path.extname(file.name) === ".research_subject";
  });

// Unmanipulated research subject JSON objects.
const rawResearchSubjectsJSON = createRawResearchSubjectsJSON(
  rawResearchSubjectFiles
);

// Most of our data manipulation will be done on this object.
const researchSubjectsJSON: any = { ...rawResearchSubjectsJSON };

// Filter out irrelevant fields.
for (const researchSubject in researchSubjectsJSON) {
  const {
    version,
    field_coord,
    name_uppercase,
    hud_icon,
    tooltip_picture,
    ...relevantFields
  }: any = researchSubjectsJSON[researchSubject];
  researchSubjectsJSON[researchSubject] = { ...relevantFields };
}

// Expand credit, metal, and crystal cost (replaces "price" field with credits, metal, and crystal fields).
for (const researchSubject in researchSubjectsJSON) {
  const { price, ...otherFields }: any = researchSubjectsJSON[researchSubject];
  const credits: number = researchSubjectsJSON[researchSubject].price.credits;
  const metal: number = researchSubjectsJSON[researchSubject].price.metal;
  const crystal: number = researchSubjectsJSON[researchSubject].price.crystal;
  researchSubjectsJSON[researchSubject] = {
    ...otherFields,
    credits: credits,
    metal: metal,
    crystal: crystal,
  };
}

// Expand exotics cost (finds "exotics" and "exotic_price" arrays and extracts the prices).
// Actually, there might be a difference between "exotics" and "exotic_price". Need to verify.
for (const researchSubject in researchSubjectsJSON) {
  const { exotics, exotic_price, ...otherFields }: any =
    researchSubjectsJSON[researchSubject];
  let andvar: number = 0;
  let tauranite: number = 0;
  let indurium: number = 0;
  let kalanide: number = 0;
  let quarnium: number = 0;
  if (exotics || exotic_price) {
    andvar = getExoticPrice(
      getExoticAliasConversion("andvar"),
      exotics || exotic_price
    );
    tauranite = getExoticPrice(
      getExoticAliasConversion("tauranite"),
      exotics || exotic_price
    );
    indurium = getExoticPrice(
      getExoticAliasConversion("indurium"),
      exotics || exotic_price
    );
    kalanide = getExoticPrice(
      getExoticAliasConversion("kalanide"),
      exotics || exotic_price
    );
    quarnium = getExoticPrice(
      getExoticAliasConversion("quarnium"),
      exotics || exotic_price
    );
  }

  researchSubjectsJSON[researchSubject] = {
    ...otherFields,
    andvar: andvar,
    tauranite: tauranite,
    indurium: indurium,
    kalanide: kalanide,
    quarnium: quarnium,
  };
}

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
    const race: string = capitalize(researchSubject.split("_")[0]);
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

function createRawResearchSubjectsJSON(rawResearchSubjectFiles: fs.Dirent[]) {
  let rawResearchSubjectsJSON: any = {};
  rawResearchSubjectFiles.forEach((file: any) => {
    rawResearchSubjectsJSON[`${file.name.split(".")[0]}`] = JSON.parse(
      fs.readFileSync(`${entitiesFolder}/${file.name}`, "utf-8").toString()
    );
  });
  return rawResearchSubjectsJSON;
}

export default function getResearchSubjects() {
  console.log(rawResearchSubjectsJSON);
  return JSON.stringify(prettifiedResearchSubjectsJSON, null, 2);
}
