import {
  capitalize,
  createJSONFromFiles,
  GenericObject,
  getLocalizedText,
  getExoticAliasConversion,
  getExoticPrice,
  getFilesByExtension,
  JSONObject,
  objectMap,
  removePropertiesFromObject,
} from "../util";
import fs from "fs";
import { flow } from "fp-ts/function";

interface ResearchSubjectObject extends GenericObject {}
interface JSONResearchSubjects extends JSONObject {
  [key: string]: ResearchSubjectObject;
}

/* GET UNMANIPULATED ("RAW") RESEARCH SUBJECT JSON OBJECTS */
const researchSubjectFiles: fs.Dirent[] =
  getFilesByExtension(".research_subject");
const rawResearchSubjects: JSONResearchSubjects = {
  ...createJSONFromFiles(researchSubjectFiles),
};

/* MANIPULATE INDIVIDUAL RESEARCH SUBJECT OBJECTS */
// Put functions in this flow that take as input a ResearchSubjectObject and output a ResearchSubjectObject
const manipulations = flow(
  removePropertiesFromObject,
  expandCosts,
  normalizeTierAndField,
  localizeNameAndDescription,
  localizePrerequisites
);

// Include properties to filter out in the array below
const manipulatedResearchSubjects: JSONResearchSubjects = {
  ...objectMap(
    rawResearchSubjects,
    (researchSubject: ResearchSubjectObject): ResearchSubjectObject => {
      return manipulations(researchSubject, [
        "version",
        "field_coord",
        "name_uppercase",
        "hud_icon",
        "tooltip_picture",
        "extra_text_filter_strings",
        "toolip_icon",
      ]);
    }
  ),
};

/* ADJUSTMENTS TO ENTIRE JSON AND GET FINAL OUTPUT  */
const researchSubjects = { ...prettify(manipulatedResearchSubjects) };

/* FUNCTIONS */
/**
 * Returns a JSON Object with the price and exotic_price properties removed. Included in our flow.
 * The properties are replaced by credits, metal, crystal, andvar, tauranite, indurium, kalanide, and quarnium properties.
 * Uses getExoticPrice and getExoticAliasConversion from util.ts
 */
function expandCosts(obj: ResearchSubjectObject): ResearchSubjectObject {
  let result = { ...obj };
  const { price, exotic_price, ...rest }: ResearchSubjectObject = result;
  let credits: number | undefined;
  let metal: number | undefined;
  let crystal: number | undefined;
  let andvar: number | undefined;
  let tauranite: number | undefined;
  let indurium: number | undefined;
  let kalanide: number | undefined;
  let quarnium: number | undefined;
  if (price) {
    credits = price.credits ? price.credits : undefined;
    metal = price.metal ? price.metal : undefined;
    crystal = price.crystal ? price.crystal : undefined;
  }
  if (exotic_price) {
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
  result = {
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
  return result;
}

/**
 * Find localized text for name and description. Included in our flow.
 * Uses getLocalizedText from util.ts
 * Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
 */
function localizeNameAndDescription(
  obj: ResearchSubjectObject
): ResearchSubjectObject {
  let result: ResearchSubjectObject = { ...obj };
  const { name, description, ...rest }: ResearchSubjectObject = result;
  const localizedName: string | undefined = name
    ? getLocalizedText(name)
    : undefined;
  const localizedDescription: string | undefined = description
    ? getLocalizedText(description)
    : undefined;
  result = {
    ...rest,
    name: localizedName,
    description: localizedDescription,
  };
  return result;
}

/**
 * Find localized text for prerequisites. Included in our flow.
 * Uses getLocalizedText from util.ts
 */
function localizePrerequisites(
  obj: ResearchSubjectObject
): ResearchSubjectObject {
  let result: ResearchSubjectObject = { ...obj };
  const { prerequisites, ...rest }: ResearchSubjectObject = result;
  const localizedPrerequisites = prerequisites
    ? [
        ...prerequisites[0].map((prerequisite: string) => {
          return getLocalizedText(prerequisite);
        }),
      ]
    : undefined;
  result = {
    prerequisites: localizedPrerequisites,
    ...rest,
  };
  return result;
}

/**
 * Normalize research tier and field. Included in our flow.
 * Example: {domain: 'military', tier: 2, domain: 'military_assault"} becomes {tier: Military 2, domain: Assault}
 * Uses capitalize from util.ts
 */
function normalizeTierAndField(
  obj: ResearchSubjectObject
): ResearchSubjectObject {
  let result: ResearchSubjectObject = { ...obj };
  const { domain, tier, field, ...rest }: ResearchSubjectObject = result;
  const normalizedTier: string | undefined =
    domain && tier ? `${capitalize(domain)} ${tier}` : undefined;
  const normalizedField: string | undefined = field
    ? field.split("_")[1]
    : undefined;
  result = {
    ...rest,
    tier: normalizedTier,
    field: normalizedField,
  };
  return result;
}

/**
 * Final adjustments for readability. Adds id, and re-orders fields.
 * Takes in the entire research subjects JSON object. Also replaces "Trader" with "TEC".
 * Uses capitalize from util.ts. Not included in our flow.
 */
function prettify(obj: JSONResearchSubjects): JSONResearchSubjects {
  let result: JSONResearchSubjects = {};
  let researchSubjectsCopy: JSONResearchSubjects = { ...obj };
  for (const key in researchSubjectsCopy) {
    const {
      name,
      description,
      tier,
      field,
      research_time,
      ...rest
    }: JSONResearchSubjects = researchSubjectsCopy[key];
    let id: string = key;
    let race: string = capitalize(key.split("_")[0]);
    race = race === "Trader" ? "TEC" : race;
    result[key] = {
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
