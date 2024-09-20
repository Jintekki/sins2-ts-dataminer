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
import {
  getResearchSubjectById,
  researchSubjects as importedResearchSubjects,
  researchSubjects,
} from "./ResearchSubjects";

interface UnitObject extends GenericObject {}
interface JSONUnits extends JSONObject {
  [key: string]: UnitObject;
}
interface ShipItemObject extends UnitObject {}
interface JSONShipItems extends JSONUnits {}

/* GET UNMANIPULATED ("RAW") UNIT ITEM JSON OBJECTS */
const unitFiles: fs.Dirent[] = getFilesByExtension(".unit_item");
const rawUnitItems: JSONUnits = {
  ...createJSONFromFiles(unitFiles),
};

/* MANIPULATE INDIVIDUAL PLANET ITEM OBJECTS */
let rawShipItems: JSONShipItems = { ...getShipUnits(rawUnitItems) };

// Put functions in this flow that take as input a ShipItemObject and output a ShipItemObject
const shipItemTransforms = flow(
  removePropertiesFromObject,
  localizeNameAndDescription,
  expandCosts,
  flattenShipTypesAndPrerequisites,
  getPrerequisiteNames
);

// Include properties to filter out in the array below
const transformedShipItems: JSONShipItems = {
  ...objectMap(rawShipItems, (shipItem: ShipItemObject): ShipItemObject => {
    return shipItemTransforms(shipItem, [
      "version",
      "hud_icon",
      "required_unit_tags",
      "consumable_stack_count",
      "item_type",
      "tooltip_picture",
      "item_level_count",
      "item_level_source",
      "item_level_prerequisites",
      "owner_constraint",
      "max_count_on_unit",
      "build_group_id",
      "tooltip_icon",
    ]);
  }),
};

/* ADJUSTMENTS TO ENTIRE JSON AND GET FINAL OUTPUT  */
const shipItems: JSONShipItems = { ...prettify(transformedShipItems) };

/* FUNCTIONS */
/**
 * Returns a JSON Object with the price and exotic_price properties removed. Included in our flow.
 * The properties are replaced by credits, metal, crystal, andvar, tauranite, indurium, kalanide, and quarnium properties.
 * Uses getExoticPrice and getExoticAliasConversion from util.ts
 */
function expandCosts(obj: ShipItemObject): ShipItemObject {
  let result = { ...obj };
  const { price, exotic_price, ...rest }: ShipItemObject = result;
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
function flattenShipTypesAndPrerequisites(obj: ShipItemObject): ShipItemObject {
  let result: ShipItemObject = { ...obj };
  const { planet_type_groups, ...rest }: ShipItemObject = result;
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
export function getShipUnits(units: JSONUnits): JSONShipItems {
  let result: JSONShipItems = {};
  let unitsCopy: JSONUnits = { ...units };
  for (const key in unitsCopy) {
    if (unitsCopy[key].item_type.includes("ship_component")) {
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
function localizeNameAndDescription(obj: ShipItemObject): ShipItemObject {
  let result: ShipItemObject = { ...obj };
  const { name, description, ...rest }: ShipItemObject = result;
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

function getPrerequisiteNames(obj: ShipItemObject): ShipItemObject {
  let result: ShipItemObject = { ...obj };
  const { build_prerequisites, ...rest }: ShipItemObject = result;
  const buildPrerequisites = build_prerequisites
    ? build_prerequisites.map((prerequisitesArray: []) =>
        prerequisitesArray.map((prerequisite: string) => {
          return { ...getResearchSubjectById(prerequisite, researchSubjects) }
            .name;
        })
      )
    : undefined;
  result = {
    ...rest,
    prerequisites: buildPrerequisites,
  };
  return result;
}

/**
 * Final adjustments for readability. Adds id, and re-orders fields.
 * Takes in the entire research subjects JSON object. Also replaces "Trader" with "TEC".
 * Uses capitalize from util.ts. Not included in our flow.
 */
function prettify(obj: JSONShipItems): JSONShipItems {
  let result: JSONShipItems = {};
  let shipItemsCopy: JSONShipItems = { ...obj };
  for (const key in shipItemsCopy) {
    const { name, description, ...rest }: JSONShipItems = shipItemsCopy[key];
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

export { rawUnitItems, rawShipItems, shipItems };
