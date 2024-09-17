// SOME WEAPONS NOT BEING FOUND

import {
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
import { weapons as importedWeapons, getWeaponById } from "./Weapon";

/* GET UNMANIPULATED ("RAW") UNIT JSON OBJECTS */
const unitFiles: fs.Dirent[] = getFilesByExtension(".unit");
const rawUnits: JSONObject = {
  ...createJSONFromFiles(unitFiles),
};

/* MANIPULATIONS */
// Filter to get only ship units
let shipUnits: JSONObject = { ...getShipUnits(rawUnits) };

// Filter out irrelevant properties. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
// However, a lot of this seems to be good information that we might want to add back in later.
shipUnits = {
  ...removePropertiesFromJSONObjects(
    [
      "version",
      "spatial",
      "physics",
      "hyperspace",
      "move",
      "attack",
      "ai",
      "ai_attack_target",
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
      ..."relevantFields",
    ],
    shipUnits
  ),
};

// Localize names and descriptions
shipUnits = { ...localizeNameAndDescription(shipUnits) };

// Expand credit, metal, and crystal cost (replaces "price" field with credits, metal, and crystal fields).
shipUnits = { ...expandCosts(shipUnits) };

// Extract durability, armor, hull, shield, and armor strength
shipUnits = { ...extractHealth(shipUnits) };

// Find weapon data
shipUnits = { ...findWeapons(shipUnits) };

/* FUNCTIONS */
/**
 * Returns a JSON Object with the price and exotic_price properties removed.
 * Uses checkIfExist, getExoticPrice and getExoticAliasConversion from util.ts
 * The properties are replaced by credits, metal, crystal, andvar, tauranite, indurium, kalanide, and quarnium properties.
 */
function expandCosts(obj: JSONObject): JSONObject {
  let result = { ...obj };
  for (const key in result) {
    const { build }: JSONObject = result[key];
    let credits: number | undefined;
    let metal: number | undefined;
    let crystal: number | undefined;
    let andvar: number | undefined;
    let tauranite: number | undefined;
    let indurium: number | undefined;
    let kalanide: number | undefined;
    let quarnium: number | undefined;
    if (checkIfExist(build)) {
      const { price, exotic_price, ...rest }: JSONObject = result[key];
      if (checkIfExist(price)) {
        credits = checkIfExist(price.credits) ? price.credits : undefined;
        metal = checkIfExist(price.metal) ? price.metal : undefined;
        crystal = checkIfExist(price.crystal) ? price.crystal : undefined;
      }
      if (checkIfExist(exotic_price)) {
        andvar = getExoticPrice(
          getExoticAliasConversion("andvar"),
          exotic_price
        );
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
  }
  return result;
}

/**
 * Returns a JSON Object with the health removed.
 * Uses checkIfExist, getExoticPrice and getExoticAliasConversion from util.ts
 * The properties are replaced by durability, armor, hull, shield, and armor_strength.
 */
export function extractHealth(obj: JSONObject): JSONObject {
  let result = { ...obj };
  for (const key in result) {
    let durability: number | undefined;
    let armor: number | undefined;
    let hull: number | undefined;
    let shield: number | undefined;
    let armor_strength: number | undefined;
    const { health, ...otherFields }: any = result[key];
    if (checkIfExist(health)) {
      durability = checkIfExist(health["durability"])
        ? health["durability"]
        : undefined;
      armor = checkIfExist(health.levels[0].max_armor_points)
        ? health.levels[0].max_armor_points
        : undefined;
      hull = checkIfExist(health.levels[0].max_hull_points)
        ? health.levels[0].max_hull_points
        : undefined;
      shield = checkIfExist(health.levels[0].max_shield_points)
        ? health.levels[0].max_shield_points
        : undefined;
      armor_strength = checkIfExist(health.levels[0].armor_strength)
        ? health.levels[0].armor_strength
        : undefined;
    }
    result[key] = {
      ...otherFields,
      durability,
      armor,
      hull,
      shield,
      armor_strength,
    };
  }
  return result;
}

/**
 * Finds weapon data
 * Weapon data grabbed from Weapon.ts
 */
export function findWeapons(units: JSONObject): JSONObject {
  const result: JSONObject = { ...units };
  for (const key in result) {
    const { weapons, ...otherFields }: { weapons: any } = result[key];
    // Get weapons from Weapons.ts
    let parsedWeapons: { weapons: any[] } = { weapons: [] };
    if (weapons) {
      {
        parsedWeapons = {
          weapons: [
            ...weapons.weapons.map((weapon: any) => {
              return getWeaponById(weapon.weapon, importedWeapons);
            }),
          ],
        };
      }
    }
    // Remove duplicate weapons
    parsedWeapons["weapons"] = [
      ...new Set(
        parsedWeapons["weapons"].map((weapon: any) => {
          return JSON.stringify(weapon);
        })
      ),
    ].map((weapon: any) => JSON.parse(weapon));
    // Remove weapons not found (investigate)
    parsedWeapons["weapons"] = parsedWeapons["weapons"].filter(
      (weapon: any) => {
        return JSON.stringify(weapon) !== "{}";
      }
    );
    result[key] = { ...otherFields, weapons: parsedWeapons };
  }
  return result;
}

/**
 * Filter to get only ship units
 */
export function getShipUnits(units: JSONObject): JSONObject {
  let result: JSONObject = {};
  let unitsCopy: JSONObject = { ...units };
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
 * Uses checkIfExist, getLocalizedText and getLocalizedDescription from util.ts
 * Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
 */
function localizeNameAndDescription(obj: JSONObject): JSONObject {
  let result: JSONObject = { ...obj };
  for (const key in result) {
    const { name, description, ...rest }: JSONObject = result[key];
    const localizedName: string | undefined = checkIfExist(name)
      ? getLocalizedText(`${key}_name`)
      : undefined;
    const localizedDescription: string | undefined = checkIfExist(description)
      ? getLocalizedText(`${key}_description`)
      : undefined;
    result[key] = {
      ...rest,
      name: localizedName,
      description: localizedDescription,
    };
  }
  return result;
}

export { rawUnits, shipUnits };
