import {
  createRawJSON,
  expandPrices,
  expandExotics,
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
for (const unit in unitsJSON) {
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
    build,
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
  }: any = unitsJSON[unit];
  unitsJSON[unit] = { ...relevantFields };
}

// Expand credit, metal, and crystal cost (replaces "price" field with credits, metal, and crystal fields).
unitsJSON = expandPrices(unitsJSON);

// Expand exotics cost (finds "exotics" and "exotic_price" arrays and extracts the prices).
unitsJSON = expandExotics(unitsJSON);

// Extract durability, armor, hull, shield, and armor strength
unitsJSON = extractHealth(unitsJSON);

// Find localized text for name and description.
// Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
for (const unit in unitsJSON) {
  const { name, ...otherFields }: any = unitsJSON[unit];
  const localizedName = getLocalizedText(`${unit}_name`);
  unitsJSON[unit] = {
    name: localizedName,
    ...otherFields,
  };
}

// Find weapon data
for (const unit in unitsJSON) {
  const { weapons, ...otherFields }: { weapons: any } = unitsJSON[unit];
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
  unitsJSON[unit] = { ...otherFields, weapons: parsedWeapons };
}

function extractHealth(objectsJSON: any) {
  const resultingJSON: any = { ...objectsJSON };
  for (const objectWithHealth in resultingJSON) {
    const { health, ...otherFields }: any = resultingJSON[objectWithHealth];
    if (health) {
      const durability = resultingJSON[objectWithHealth].health.durability;
      const armor =
        resultingJSON[objectWithHealth].health.levels[0].max_armor_points;
      const hull =
        resultingJSON[objectWithHealth].health.levels[0].max_hull_points;
      const shield =
        resultingJSON[objectWithHealth].health.levels[0].max_shield_points;
      const armor_strength =
        resultingJSON[objectWithHealth].health.levels[0].armor_strength;
      resultingJSON[objectWithHealth] = {
        ...otherFields,
        durability: durability,
        hull: hull,
        armor: armor,
        shield: shield,
        armor_strength: armor_strength,
      };
    }
  }
  return resultingJSON;
}

export function getRawUnits() {
  return JSON.stringify(rawUnitsJSON, null, 2);
}

export function getRawShipUnits() {
  let resultingJSON: any = {};
  for (const unit in rawUnitsJSON) {
    if (
      (unit.includes("capital_ship") ||
        unit.includes("corvette") ||
        unit.includes("frigate") ||
        unit.includes("cruiser") ||
        unit.includes("titan")) &&
      !unit.includes("structure")
    ) {
      resultingJSON[unit] = unitsJSON[unit];
    }
  }
  return JSON.stringify(resultingJSON, null, 2);
}

export function getShipUnits() {
  let resultingJSON: any = {};
  for (const unit in unitsJSON) {
    if (
      (unit.includes("capital_ship") ||
        unit.includes("corvette") ||
        unit.includes("frigate") ||
        unit.includes("cruiser") ||
        unit.includes("titan")) &&
      !unit.includes("structure")
    ) {
      resultingJSON[unit] = unitsJSON[unit];
    }
  }

  return JSON.stringify(resultingJSON, null, 2);
}
