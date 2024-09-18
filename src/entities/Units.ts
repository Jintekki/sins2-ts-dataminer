// SOME WEAPONS NOT BEING FOUND

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
  JSONWeapons,
} from "./Weapons";

interface UnitObject extends GenericObject {}
interface JSONUnits extends JSONObject {
  [key: string]: UnitObject;
}
interface ShipUnitObject extends UnitObject {}
interface JSONShipUnits extends JSONUnits {}

/* GET UNMANIPULATED ("RAW") RESEARCH SUBJECT JSON OBJECTS */
const unitFiles: fs.Dirent[] = getFilesByExtension(".unit");
const rawUnits: JSONUnits = {
  ...createJSONFromFiles(unitFiles),
};

/* MANIPULATIONS AND GET FINAL RESEARCH SUBJECT JSON OBJECTS */
// Ship Units
let rawShipUnits: JSONShipUnits = { ...getShipUnits(rawUnits) };

const shipManipulations = flow(
  removePropertiesFromObject,
  expandCosts,
  extractHealth,
  findWeapons
);

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

const localizedShipUnits: JSONShipUnits = {
  ...localizeNameAndDescription(manipulatedShipUnits),
};

const shipUnits = { ...localizedShipUnits };

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
  const { health, ...otherFields }: any = result;
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
    ...otherFields,
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
  let parsedWeapons: JSONWeapons = {};
  if (weapons) {
    {
      parsedWeapons = {
        weapons: [
          ...weapons.weapons.map(
            (weapon: WeaponObject): WeaponObject | undefined => {
              if (!getWeaponById(weapon.weapon, importedWeapons)) {
                console.log(weapon.weapon);
              }
              return getWeaponById(weapon.weapon, importedWeapons);
            }
          ),
        ],
      };
    }
  }
  result = {
    ...rest,
    weapons: parsedWeapons,
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

export { rawUnits, rawShipUnits, shipUnits };
