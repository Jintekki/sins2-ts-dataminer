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
interface ShipUnitObject extends UnitObject {}
interface JSONShipUnits extends JSONUnits {}

/* GET UNMANIPULATED ("RAW") UNIT JSON OBJECTS */
const unitFiles: fs.Dirent[] = getFilesByExtension(".unit");
const rawUnits: JSONUnits = {
  ...createJSONFromFiles(unitFiles),
};

/* MANIPULATE INDIVIDUAL SHIP OBJECTS */
let rawShipUnits: JSONShipUnits = { ...getShipUnits(rawUnits) };

// Put functions in this flow that take as input a ShipUnitObject and output a ShipUnitObject
const shipManipulations = flow(
  removePropertiesFromObject,
  expandCosts,
  extractHealth,
  findWeapons
);

// Include properties to filter out in the array below
const manipulatedShipUnits: JSONShipUnits = {
  ...objectMap(rawShipUnits, (shipUnit: ShipUnitObject): ShipUnitObject => {
    return shipManipulations(shipUnit, [
      "version",
      "spatial",
      "physics",
      "hyperspace",
      "move",
      "attack",
      "ai",
      "ai_attack_target",
      "player_ai",
      "user_interface",
      "formation",
      "spawn_debris",
      "antimatter",
      "levels",
      "carrier",
      "items",
      "target_filter_unit_type",
      "tags",
      "is_loot_collector",
      "abilities",
      "ship_roles",
      "skin_groups",
      "can_join_fleet",
      "action_effect_size",
      "child_meshes",
    ]);
  }),
};

/* ADJUSTMENTS TO ENTIRE JSON AND GET FINAL OUTPUT  */
const localizedShipUnits: JSONShipUnits = {
  ...localizeNameAndDescription(manipulatedShipUnits),
};

const shipUnits = { ...prettify(localizedShipUnits) };

/* FUNCTIONS */
/**
 * Returns a JSON Object with the price and exotic_price properties removed.
 * Uses getExoticPrice and getExoticAliasConversion from util.ts
 * The properties are replaced by credits, metal, crystal, andvar, tauranite, indurium, kalanide, and quarnium properties.
 */
function expandCosts(obj: ShipUnitObject): ShipUnitObject {
  let result = { ...obj };
  const { build, ...rest }: ShipUnitObject = result;
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
 * Returns a JSON Object with the health removed.
 * Uses getExoticPrice and getExoticAliasConversion from util.ts
 * The properties are replaced by durability, armor, hull, shield, and armor_strength.
 */
export function extractHealth(obj: ShipUnitObject): ShipUnitObject {
  let result = { ...obj };
  let durability: number | undefined;
  let armor: number | undefined;
  let hull: number | undefined;
  let shield: number | undefined;
  let armor_strength: number | undefined;
  const { health, ...rest }: any = result;
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
export function findWeapons(obj: ShipUnitObject): ShipUnitObject {
  let result: ShipUnitObject = { ...obj };
  const { weapons, ...rest }: ShipUnitObject = result;
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
 * Filter to get only ship units
 */
export function getShipUnits(units: JSONUnits): JSONShipUnits {
  let result: JSONShipUnits = {};
  let unitsCopy: JSONUnits = { ...units };
  for (const key in unitsCopy) {
    if (
      (key.includes("capital_ship") ||
        key.includes("corvette") ||
        key.includes("frigate") ||
        key.includes("cruiser") ||
        key.includes("titan")) &&
      !key.includes("structure")
    ) {
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
function localizeNameAndDescription(obj: JSONShipUnits): JSONShipUnits {
  let result: JSONShipUnits = { ...obj };
  for (const key in result) {
    const { name, description, ...rest }: JSONShipUnits = result[key];
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
function prettify(obj: JSONShipUnits): JSONShipUnits {
  let result: JSONShipUnits = {};
  let shipUnitsCopy: JSONShipUnits = { ...obj };
  for (const key in shipUnitsCopy) {
    const { name, description, ...rest }: JSONShipUnits = shipUnitsCopy[key];
    let id: string = key;
    let race: string = capitalize(key.split("_")[0]);
    race = race === "Trader" ? "TEC" : race;
    let newKey = `${race} ${name}`;
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

export { rawUnits, rawShipUnits, shipUnits };
