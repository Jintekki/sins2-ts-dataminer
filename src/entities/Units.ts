// HEALTH EXTRACTION NOT WORKING
// SOME WEAPONS NOT BEING FOUND

import {
  createRawJSON,
  checkIfPropertyExist,
  getAllCost,
  getLocalizedText,
  getRawFiles,
} from "../util";
import getWeapons, { getWeaponById } from "./Weapons";

// Unmanipulated research subject JSON objects.
const rawUnitsJSON = createRawJSON(getRawFiles(".unit"));

// Most of our data manipulation will be done on this object.
let unitsJSON: any = { ...rawUnitsJSON };

// Filter out irrelevant fields. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
// However, a lot of this seems to be good information that we might want to add back in later.
for (const unitKey in unitsJSON) {
  const {
    version,
    spatial,
    physics,
    hyperspace,
    move,
    attack,
    ai,
    ai_attack_target,
    user_interface,
    formation,
    spawn_debris,
    antimatter,
    levels,
    carrier,
    items,
    target_filter_unit_type,
    tags,
    is_loot_collector,
    abilities,
    ship_roles,
    skin_groups,
    can_join_fleet,
    action_effect_size,
    child_meshes,
    ...relevantFields
  }: any = unitsJSON[unitKey];
  unitsJSON[unitKey] = { ...relevantFields };
}

// Expand credit, metal, and crystal cost (replaces "price" field with credits, metal, and crystal fields).
unitsJSON = getAllCost(unitsJSON);

// Extract durability, armor, hull, shield, and armor strength
for (const unitKey in unitsJSON) {
  let durability: number | undefined;
  let armor: number | undefined;
  let hull: number | undefined;
  let shield: number | undefined;
  let armor_strength: number | undefined;
  const { health, ...otherFields }: any = unitsJSON[unitKey];
  if (checkIfPropertyExist(health)) {
    durability = checkIfPropertyExist(health["durability"])
      ? health["durability"]
      : undefined;
    armor = checkIfPropertyExist(health.levels[0].max_armor_points)
      ? health.levels[0].max_armor_points
      : undefined;
    hull = checkIfPropertyExist(health.levels[0].max_hull_points)
      ? health.levels[0].max_hull_points
      : undefined;
    shield = checkIfPropertyExist(health.levels[0].max_shield_points)
      ? health.levels[0].max_shield_points
      : undefined;
    armor_strength = checkIfPropertyExist(health.levels[0].armor_strength)
      ? health.levels[0].armor_strength
      : undefined;
  }
  unitsJSON[unitKey] = {
    ...otherFields,
    durability,
    armor,
    hull,
    shield,
    armor_strength,
  };
}

// Find localized text for name and description.
// Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
for (const unitKey in unitsJSON) {
  const { name, ...otherFields }: any = unitsJSON[unitKey];
  const localizedName = getLocalizedText(`${unitKey}_name`);
  const localizedDescription = getLocalizedText(`${unitKey}_description`);
  unitsJSON[unitKey] = {
    name: localizedName,
    description: localizedDescription,
    ...otherFields,
  };
}

// Find weapon data
for (const unitKey in unitsJSON) {
  const { weapons, ...otherFields }: { weapons: any } = unitsJSON[unitKey];
  // Get weapons from Weapons.ts
  let parsedWeapons: { weapons: any[] } = { weapons: [] };
  if (weapons) {
    {
      parsedWeapons = {
        weapons: [
          ...weapons.weapons.map((weapon: any) => {
            return getWeaponById(weapon.weapon, JSON.parse(getWeapons()));
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
  parsedWeapons["weapons"] = parsedWeapons["weapons"].filter((weapon: any) => {
    return JSON.stringify(weapon) !== "{}";
  });
  unitsJSON[unitKey] = { ...otherFields, weapons: parsedWeapons };
}

export function getRawUnits() {
  return JSON.stringify(rawUnitsJSON, null, 2);
}

export function getRawShipUnits() {
  let resultingJSON: any = {};
  for (const unitKey in rawUnitsJSON) {
    if (
      (unitKey.includes("capital_ship") ||
        unitKey.includes("corvette") ||
        unitKey.includes("frigate") ||
        unitKey.includes("cruiser") ||
        unitKey.includes("titan")) &&
      !unitKey.includes("structure")
    ) {
      resultingJSON[unitKey] = unitsJSON[unitKey];
    }
  }
  return JSON.stringify(resultingJSON, null, 2);
}

export function getShipUnits() {
  let resultingJSON: any = {};
  for (const unitKey in unitsJSON) {
    if (
      (unitKey.includes("capital_ship") ||
        unitKey.includes("corvette") ||
        unitKey.includes("frigate") ||
        unitKey.includes("cruiser") ||
        unitKey.includes("titan")) &&
      !unitKey.includes("structure")
    ) {
      resultingJSON[unitKey] = { ...unitsJSON[unitKey] };
    }
  }

  return JSON.stringify(resultingJSON, null, 2);
}
