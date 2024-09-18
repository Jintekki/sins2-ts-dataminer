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

interface UnitObject extends GenericObject {}
interface JSONUnits extends JSONObject {
  [key: string]: UnitObject;
}
interface PlanetItemObject extends UnitObject {}
interface JSONPlanetItems extends JSONUnits {
  [key: string]: PlanetItemObject;
}

/* GET UNMANIPULATED ("RAW") UNIT ITEM JSON OBJECTS */
const unitFiles: fs.Dirent[] = getFilesByExtension(".unit_item");
const rawUnitItems: JSONUnits = {
  ...createJSONFromFiles(unitFiles),
};

/* MANIPULATE INDIVIDUAL PLANET ITEM OBJECTS */
let rawPlanetItems: JSONPlanetItems = { ...getPlanetUnits(rawUnitItems) };

// Put functions in this flow that take as input a PlanetItemObject and output a PlanetItemObject
const planetItemManipulations = flow(
  removePropertiesFromObject,
  localizeNameAndDescription,
  expandCosts,
  flattenPlanetTypesAndPrerequisites
);

// Include properties to filter out in the array below
const manipulatedPlanetItems: JSONPlanetItems = {
  ...objectMap(
    rawPlanetItems,
    (planetItem: PlanetItemObject): PlanetItemObject => {
      return planetItemManipulations(planetItem, [
        "version",
        "hud_icon",
        "tooltip_icon",
        "required_surveying_level",
        "planet_modifiers",
        "max_count_on_unit",
        "build_group_id",
        "item_type",
        "item_level_count",
        "item_level_source",
        "item_level_prerequisites",
        "tooltip_picture",
      ]);
    }
  ),
};

/* ADJUSTMENTS TO ENTIRE JSON AND GET FINAL OUTPUT  */
const planetItems: JSONPlanetItems = { ...prettify(manipulatedPlanetItems) };

/* FUNCTIONS */
/**
 * Returns a JSON Object with the price and exotic_price properties removed. Included in our flow.
 * The properties are replaced by credits, metal, crystal, andvar, tauranite, indurium, kalanide, and quarnium properties.
 * Uses getExoticPrice and getExoticAliasConversion from util.ts
 */
function expandCosts(obj: PlanetItemObject): PlanetItemObject {
  let result = { ...obj };
  const { price, exotic_price, ...rest }: PlanetItemObject = result;
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
function flattenPlanetTypesAndPrerequisites(
  obj: PlanetItemObject
): PlanetItemObject {
  let result: PlanetItemObject = { ...obj };
  const { planet_type_groups, ...rest }: PlanetItemObject = result;
  let planetTypes: [] | undefined;
  let prerequisites: [] | undefined;
  if (planet_type_groups) {
    planetTypes = planet_type_groups[0].planet_types
      ? planet_type_groups[0].planet_types
      : undefined;
    prerequisites = planet_type_groups[0].prerequisites
      ? planet_type_groups[0].prerequisites
      : undefined;
  }
  result = {
    ...rest,
    planet_type: planetTypes,
    prerequisites: prerequisites,
  };
  return result;
}

/**
 * Filter to get only planet items
 */
export function getPlanetUnits(units: JSONUnits): JSONPlanetItems {
  let result: JSONPlanetItems = {};
  let unitsCopy: JSONUnits = { ...units };
  for (const key in unitsCopy) {
    if (unitsCopy[key].item_type.includes("planet_component")) {
      result[key] = { ...unitsCopy[key] };
    }
  }
  return result;
}

/**
 * Find localized text for name and description. Included in our flow.
 * Uses getLocalizedText from util.ts
 * Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
 */
function localizeNameAndDescription(obj: PlanetItemObject): PlanetItemObject {
  let result: PlanetItemObject = { ...obj };
  const { name, description, ...rest }: PlanetItemObject = result;
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
 * Final adjustments for readability. Adds id, and re-orders fields.
 * Takes in the entire research subjects JSON object. Also replaces "Trader" with "TEC".
 * Uses capitalize from util.ts. Not included in our flow.
 */
function prettify(obj: JSONPlanetItems): JSONPlanetItems {
  let result: JSONPlanetItems = {};
  let planetItemsCopy: JSONPlanetItems = { ...obj };
  for (const key in planetItemsCopy) {
    const { name, description, ...rest }: JSONPlanetItems =
      planetItemsCopy[key];
    let id: string = key;
    let newKey = key
      .split("_")
      .map((word: string) => capitalize(word))
      .join(" ");
    let race: string = newKey.split(" ")[0];
    race = race === "Trader" ? "TEC" : race;
    newKey = newKey.replace("Trader", "TEC");
    result[newKey] = {
      name,
      id,
      description,
      race,
      ...rest,
    };
  }
  return result;
}

export { rawUnitItems, rawPlanetItems, planetItems };
