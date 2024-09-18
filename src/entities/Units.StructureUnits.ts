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
  weapons as importedWeapons,
  getWeaponById,
  WeaponObject,
} from "./Weapons";

interface UnitObject extends GenericObject {}
interface JSONUnits extends JSONObject {
  [key: string]: UnitObject;
}
interface StructureUnitObject extends UnitObject {}
interface JSONStructureUnits extends JSONUnits {}

/* GET UNMANIPULATED ("RAW") STRUCTURE JSON OBJECTS */
const unitFiles: fs.Dirent[] = getFilesByExtension(".unit");
const rawUnits: JSONUnits = {
  ...createJSONFromFiles(unitFiles),
};

/* MANIPULATIONS AND GET FINAL SHIP STRUCTURE JSON OBJECTS */
let rawStructureUnits: JSONStructureUnits = {
  ...getStructureUnits(rawUnits),
};

// Put functions in this flow that take as input a StructureUnitObject and output a StructureUnitObject
const structureManipulations = flow(
  removePropertiesFromObject,
  expandCosts,
  extractHealth,
  findWeapons,
  getSlotTypeAndSlotsRequired
);

// Include properties to filter out in the array below
const manipulatedStructureUnits: JSONStructureUnits = {
  ...objectMap(
    rawStructureUnits,
    (structureUnit: StructureUnitObject): StructureUnitObject => {
      return structureManipulations(structureUnit, [
        "version",
        "spatial",
        "physics",
        "attack",
        "ai",
        "ai_attack_target",
        "user_interface",
        "build_group_id",
        "formation",
        "spawn_debris",
        "target_filter_unit_type",
        "tags",
        "virtual_supply_cost",
        "skin_groups",
        "action_effect_size",
        "unit_factory",
        "ship_component_shop",
        "research_provider",
        "culture_provider",
        "player_ai",
        "carrier",
        "child_meshes",
        "items",
        "stages",
        "modifiers",
      ]);
    }
  ),
};

/* ADJUSTMENTS TO ENTIRE JSON AND GET FINAL OUTPUT  */
const localizedStructureUnits: JSONStructureUnits = {
  ...localizeNameAndDescription(manipulatedStructureUnits),
};

const structureUnits = { ...prettify(localizedStructureUnits) };

/* FUNCTIONS */
/**
 * Returns a JSON Object with the price and exotic_price properties removed.
 * Uses getExoticPrice and getExoticAliasConversion from util.ts
 * The properties are replaced by credits, metal, crystal, andvar, tauranite, indurium, kalanide, and quarnium properties.
 */
function expandCosts(obj: StructureUnitObject): StructureUnitObject {
  let result = { ...obj };
  const { build, ...rest }: StructureUnitObject = result;
  let credits: number | undefined;
  let metal: number | undefined;
  let crystal: number | undefined;
  let andvar: number | undefined;
  let tauranite: number | undefined;
  let indurium: number | undefined;
  let kalanide: number | undefined;
  let quarnium: number | undefined;
  if (build) {
    if (build.price) {
      credits = build.price.credits ? build.price.credits : undefined;
      metal = build.price.metal ? build.price.metal : undefined;
      crystal = build.price.crystal ? build.price.crystal : undefined;
    }
    if (build.exotic_price) {
      andvar = getExoticPrice(
        getExoticAliasConversion("andvar"),
        build.exotic_price
      );
      tauranite = getExoticPrice(
        getExoticAliasConversion("tauranite"),
        build.exotic_price
      );
      indurium = getExoticPrice(
        getExoticAliasConversion("indurium"),
        build.exotic_price
      );
      kalanide = getExoticPrice(
        getExoticAliasConversion("kalanide"),
        build.exotic_price
      );
      quarnium = getExoticPrice(
        getExoticAliasConversion("quarnium"),
        build.exotic_price
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
  }
  return result;
}

/**
 * Gets slot type and slots required
 */
function getSlotTypeAndSlotsRequired(
  obj: StructureUnitObject
): StructureUnitObject {
  let result: StructureUnitObject = { ...obj };
  const { structure, ...rest }: StructureUnitObject = result;
  let slotType: string | undefined;
  let slotsRequired: string | undefined;
  if (structure) {
    slotType = structure.slot_type ? structure.slot_type : undefined;
    slotsRequired = structure.slots_required
      ? structure.slots_required
      : undefined;
  }
  result = {
    ...rest,
    slot_type: slotType,
    slots_required: slotsRequired,
  };
  return result;
}

/**
 * Returns a JSON Object with the health removed.
 * Uses getExoticPrice and getExoticAliasConversion from util.ts
 * The properties are replaced by durability, armor, hull, shield, and armor_strength.
 */
export function extractHealth(obj: StructureUnitObject): StructureUnitObject {
  let result = { ...obj };
  let durability: number | undefined;
  let armor: number | undefined;
  let hull: number | undefined;
  let shield: number | undefined;
  let armor_strength: number | undefined;
  const { health, ...rest }: StructureUnitObject = result;
  if (health) {
    durability = health["durability"] ? health["durability"] : undefined;
    armor = health.levels[0].max_armor_points
      ? health.levels[0].max_armor_points
      : undefined;
    hull = health.levels[0].max_hull_points
      ? health.levels[0].max_hull_points
      : undefined;
    shield = health.levels[0].max_shield_points
      ? health.levels[0].max_shield_points
      : undefined;
    armor_strength = health.levels[0].armor_strength
      ? health.levels[0].armor_strength
      : undefined;
  }
  result = {
    ...rest,
    durability,
    armor,
    hull,
    shield,
    armor_strength,
  };
  return result;
}

/**
 * Finds weapon data
 * Weapon data grabbed from Weapon.ts
 */
export function findWeapons(obj: StructureUnitObject): StructureUnitObject {
  let result: StructureUnitObject = { ...obj };
  const { weapons, ...rest }: StructureUnitObject = result;
  let parsedWeapons: Array<WeaponObject> = [];
  if (weapons) {
    parsedWeapons = [
      ...weapons.weapons.map(
        (weapon: WeaponObject): WeaponObject | undefined => {
          return getWeaponById(weapon.weapon, importedWeapons);
        }
      ),
    ];
  }

  // get unique weapons
  let uniqueParsedWeapons: Array<WeaponObject> = [
    ...new Set(
      parsedWeapons.map((weapon: WeaponObject) => JSON.stringify(weapon))
    ),
  ].map((weapon: string) => JSON.parse(weapon));

  // Add count to each weapon
  uniqueParsedWeapons = uniqueParsedWeapons.map(
    ({ id, ...rest }: WeaponObject): WeaponObject => {
      let uniqueWeaponID = id;
      let count = 0;
      parsedWeapons.forEach(({ id }: WeaponObject) => {
        if (uniqueWeaponID === id) {
          count++;
        }
      });
      return { ...rest, id: uniqueWeaponID, count: count };
    }
  );
  result = {
    ...rest,
    weapons: uniqueParsedWeapons,
  };
  return result;
}

/**
 * Filter to get only structure units
 */
export function getStructureUnits(units: JSONUnits): JSONStructureUnits {
  let result: JSONStructureUnits = {};
  let unitsCopy: JSONUnits = { ...units };
  for (const key in unitsCopy) {
    if (key.includes("structure") || key.includes("starbase")) {
      result[key] = { ...unitsCopy[key] };
    }
  }
  return result;
}

/**
 * Find localized text for name and description.
 * Uses getLocalizedText and getLocalizedDescription from util.ts
 * Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
 */
function localizeNameAndDescription(
  obj: JSONStructureUnits
): JSONStructureUnits {
  let result: JSONStructureUnits = { ...obj };
  for (const key in result) {
    const { name, description, ...rest }: JSONStructureUnits = result[key];
    const localizedName = getLocalizedText(`${key}_name`);
    const localizedDescription = getLocalizedText(`${key}_description`);
    result[key] = {
      ...rest,
      name: localizedName,
      description: localizedDescription,
    };
  }
  return result;
}

/**
 * Final adjustments for readability. Adds id, and re-orders fields.
 * Takes in the entire research subjects JSON object. Also replaces "Trader" with "TEC".
 * Uses capitalize from util.ts. Not included in our flow.
 */
function prettify(obj: JSONStructureUnits): JSONStructureUnits {
  let result: JSONStructureUnits = {};
  let structureUnitsCopy: JSONStructureUnits = { ...obj };
  for (const key in structureUnitsCopy) {
    const { name, description, ...rest }: JSONStructureUnits =
      structureUnitsCopy[key];
    let id: string = key;
    let race: string = capitalize(key.split("_")[0]);
    race = race === "Trader" ? "TEC" : race;
    result[key] = {
      name,
      id,
      description,
      race,
      ...rest,
    };
  }
  return result;
}

export { rawUnits, rawStructureUnits, structureUnits };
