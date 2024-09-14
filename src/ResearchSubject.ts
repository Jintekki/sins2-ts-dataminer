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

const rawResearchSubjectsJSON = createRawResearchSubjectsJSON(
  rawResearchSubjectFiles
);

const researchSubjectsJSON: any = { ...rawResearchSubjectsJSON };

// Filter out irrelevant fields
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

// Expand credit, metal, and crystal cost
for (const researchSubject in researchSubjectsJSON) {
  const { price, ...otherFields }: any = researchSubjectsJSON[researchSubject];
  const credits: number = researchSubjectsJSON[researchSubject].price.credits;
  const metals: number = researchSubjectsJSON[researchSubject].price.metal;
  const crystal: number = researchSubjectsJSON[researchSubject].price.crystal;
  researchSubjectsJSON[researchSubject] = {
    ...otherFields,
    credits: credits,
    metal: metals,
    crystal: crystal,
  };
}

// Expand exotics cost
for (const researchSubject in researchSubjectsJSON) {
  const { exotics, ...otherFields }: any =
    researchSubjectsJSON[researchSubject];
  let andvar: number = 0;
  let tauranite: number = 0;
  let indurium: number = 0;
  let kalanide: number = 0;
  let quarnium: number = 0;
  if (exotics) {
    andvar = getExoticPrice(getExoticAliasConversion("andvar"), exotics);
    tauranite = getExoticPrice(getExoticAliasConversion("tauranite"), exotics);
    indurium = getExoticPrice(getExoticAliasConversion("indurium"), exotics);
    kalanide = getExoticPrice(getExoticAliasConversion("kalanide"), exotics);
    quarnium = getExoticPrice(getExoticAliasConversion("quarnium"), exotics);
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

// Find localized text for name, description, and prerequisites
for (const researchSubject in researchSubjectsJSON) {
  const { name, description, prerequisites, ...otherFields }: any =
    researchSubjectsJSON[researchSubject];
  const localizedName = getLocalizedText(name);
  const localizedDescription = description ? getLocalizedText(description) : "";
  const localizedPrerequisites = prerequisites
    ? [
        ...prerequisites[0].map((prerequiste: string) => {
          return researchSubjectsJSON[prerequiste].name;
        }),
      ]
    : [];
  researchSubjectsJSON[researchSubject] = {
    name: localizedName,
    description: localizedDescription,
    prerequisites: localizedPrerequisites,
    ...otherFields,
  };
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
  return JSON.stringify(researchSubjectsJSON);
}
