import {
  capitalize,
  checkIfExist,
  createJSONFromFiles,
  getLocalizedText,
  getExoticAliasConversion,
  getExoticPrice,
  getFilesByExtension,
  JSONObject,
  removePropertiesFromJSONObjects,
} from "../util";
import fs from "fs";

/* GET UNMANIPULATED ("RAW") RESEARCH SUBJECT JSON OBJECTS */
const researchSubjectFiles: fs.Dirent[] =
  getFilesByExtension(".research_subject");
const rawResearchSubjects: JSONObject = {
  ...createJSONFromFiles(researchSubjectFiles),
};

/* MANIPULATIONS */
let researchSubjects: JSONObject = { ...rawResearchSubjects };
// Filter out irrelevant properties
researchSubjects = {
  ...removePropertiesFromJSONObjects(
    [
      "version",
      "field_coord",
      "name_uppercase",
      "hud_icon",
      "tooltip_picture",
      "extra_text_filter_strings",
      "toolip_icon",
    ],
    rawResearchSubjects
  ),
};

// Expand credit, metal, and crystal, and individual exotics cost (replaces "price" and "exotic_price")
researchSubjects = {
  ...expandCosts(researchSubjects),
};

// Normalize research tier and field
// Example: {domain: 'military', tier: 2, domain: 'military_assault"} becomes {tier: Military 2, domain: Assault}.
researchSubjects = {
  ...normalizeTierAndField(researchSubjects),
};

// Find localized text for name and description.
researchSubjects = {
  ...localizeNameAndDescription(researchSubjects),
};

// Find localized text for prerequisites. This manipulation assumes that the names have already been localized.
researchSubjects = {
  ...localizePrerequisites(researchSubjects),
};

// Final adjustments for readability. Adds race field, more human readable key, id, and re-orders fields.
researchSubjects = { ...prettify(researchSubjects) };

/* FUNCTIONS */
/**
 * Returns a JSON Object with the price and exotic_price properties removed.
 * Uses checkIfExist, getExoticPrice and getExoticAliasConversion from util.ts
 * The properties are replaced by credits, metal, crystal, andvar, tauranite, indurium, kalanide, and quarnium properties.
 */
function expandCosts(obj: JSONObject): JSONObject {
  let result = { ...obj };
  for (const key in result) {
    const { price, exotic_price, ...rest }: any = result[key];
    let credits: number | undefined;
    let metal: number | undefined;
    let crystal: number | undefined;
    let andvar: number | undefined;
    let tauranite: number | undefined;
    let indurium: number | undefined;
    let kalanide: number | undefined;
    let quarnium: number | undefined;
    if (checkIfExist(price)) {
      credits = checkIfExist(price.credits) ? price.credits : undefined;
      metal = checkIfExist(price.metal) ? price.metal : undefined;
      crystal = checkIfExist(price.crystal) ? price.crystal : undefined;
    }
    if (checkIfExist(exotic_price)) {
      andvar = getExoticPrice(getExoticAliasConversion("andvar"), exotic_price);
      tauranite = getExoticPrice(
        getExoticAliasConversion("tauranite"),
        exotic_price
      );
      indurium = getExoticPrice(
        getExoticAliasConversion("indurium"),
        exotic_price
      );
      kalanide = getExoticPrice(
        getExoticAliasConversion("kalanide"),
        exotic_price
      );
      quarnium = getExoticPrice(
        getExoticAliasConversion("quarnium"),
        exotic_price
      );
    }
    result[key] = {
      ...rest,
      credits,
      metal,
      crystal,
      andvar,
      tauranite,
      indurium,
      kalanide,
      quarnium,
    };
  }
  return result;
}

/**
 * Find localized text for name and description.
 * Uses checkIfExist, getLocalizedText and getLocalizedDescription from util.ts
 * Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
 */
function localizeNameAndDescription(obj: JSONObject): JSONObject {
  let result: any = { ...obj };
  for (const key in result) {
    const { name, description, ...rest }: any = result[key];
    const localizedName: string | undefined = checkIfExist(name)
      ? getLocalizedText(name)
      : undefined;
    const localizedDescription: string | undefined = checkIfExist(description)
      ? getLocalizedText(description)
      : undefined;
    result[key] = {
      ...rest,
      name: localizedName,
      description: localizedDescription,
    };
  }
  return result;
}

/**
 * Find localized text for prerequisites.
 * Uses checkIfExist from util.ts
 * This function assumes that the names have already been localized.
 */
function localizePrerequisites(obj: JSONObject): JSONObject {
  let result: any = { ...obj };
  for (const key in result) {
    const { prerequisites, ...otherFields }: any = result[key];
    const localizedPrerequisites = checkIfExist(prerequisites)
      ? [
          ...prerequisites[0].map((prerequisite: string) => {
            return result[prerequisite].name;
          }),
        ]
      : undefined;
    result[key] = {
      prerequisites: localizedPrerequisites,
      ...otherFields,
    };
  }
  return result;
}

/**
 * Normalize research tier and field
 * Uses checkIfExist and capitalize from util.ts
 * Example: {domain: 'military', tier: 2, domain: 'military_assault"} becomes {tier: Military 2, domain: Assault}.
 */
function normalizeTierAndField(obj: JSONObject): JSONObject {
  let result: any = { ...obj };
  for (const key in result) {
    const { domain, tier, field, ...rest }: any = result[key];
    const normalizedTier: string | undefined =
      checkIfExist(domain) && checkIfExist(tier)
        ? `${capitalize(domain)} ${tier}`
        : undefined;
    const normalizedField: string | undefined = checkIfExist(field)
      ? capitalize(field.split("_")[1])
      : undefined;
    result[key] = {
      ...rest,
      tier: normalizedTier,
      field: normalizedField,
    };
  }
  return result;
}

/**
 * Final adjustments for readability. Adds race field, more human readable key, id, and re-orders fields.
 * Uses capitalize from util.ts
 * Also replaces "Trader" with "TEC".
 */
function prettify(obj: JSONObject): JSONObject {
  let result: any = {};
  let json = { ...obj };
  for (const key in json) {
    const { name, description, tier, field, research_time, ...rest }: any =
      json[key];
    let id: string = key;
    let race: string = capitalize(key.split("_")[0]);
    race = race === "Trader" ? "TEC" : race;
    let newKey: string = `${race} ${name}`;
    result[newKey] = {
      name,
      description,
      id,
      tier,
      field,
      research_time,
      race,
      ...rest,
    };
  }
  return result;
}

export { rawResearchSubjects, researchSubjects };
