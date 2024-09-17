import {
  capitalize,
  checkIfExist,
  createJSONFromFiles,
  getLocalizedText,
  getFilesByExtension,
  JSONObject,
  removePropertiesFromJSONObjects,
  roundTo,
} from "../util";
import fs from "fs";

/* GET UNMANIPULATED ("RAW") WEAPON JSON OBJECTS */
const weaponFiles: fs.Dirent[] = getFilesByExtension(".weapon");
const rawWeapons: JSONObject = {
  ...createJSONFromFiles(weaponFiles),
};

/* MANIPULATIONS */
let weapons: JSONObject = { ...rawWeapons };
// Filter out irrelevant properties
weapons = {
  ...removePropertiesFromJSONObjects(
    [
      "version",
      "pitch_speed",
      "yaw_speed",
      "pitch_firing_tolerance",
      "yaw_firing_tolerance",
      "uniforms_target_filter_id",
      "attack_target_type_groups",
      "damage_affect_type",
      "tags",
      "acquire_target_logic",
      "effects",
      "turret",
      "muzzle_positions",
      "burst_pattern",
    ],
    weapons
  ),
};

// Find localized text for name.
// Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
weapons = { ...localizeName(weapons) };

// Get travel speed. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
weapons = { ...getTravelSpeed(weapons) };

// Calculate DPS. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
weapons = { ...calculateDPS(weapons) };

// Final adjustments for readability. Human readable key, id, and re-orders fields.
weapons = { ...prettify(weapons) };

/* FUNCTIONS */
/**
 * Calculate DPS. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
 * Uses roundTo from util.ts
 */
function calculateDPS(obj: JSONObject) {
  const result: JSONObject = { ...obj };
  for (const key in result) {
    const { ...fields }: { firing: any } = result[key];
    let dps: number = 0;
    if (result[key].weapon_type === "normal") {
      dps = ((60 / result[key].cooldown_duration) * result[key].damage) / 60;
    } else if (result[key].weapon_type === "planet_bombing") {
      dps =
        ((60 / result[key].cooldown_duration) * result[key].bombing_damage) /
        60;
    }
    dps = roundTo(dps, 1);
    result[key] = {
      ...fields,
      dps: dps,
    };
  }
  return result;
}

/**
 * Get travel speed. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
 * Uses checkIfExist from util.ts
 */
function getTravelSpeed(obj: JSONObject) {
  const result: JSONObject = { ...obj };
  for (const key in result) {
    const { firing, ...rest }: { firing: any } = weapons[key];
    let travelSpeed = checkIfExist(firing.travel_speed)
      ? firing.travel_speed
      : 0;
    result[key] = {
      ...rest,
      travel_speed: travelSpeed,
    };
  }
  return result;
}

/**
 * Find localized text for name and description.
 * Uses checkIfExist, getLocalizedText and getLocalizedDescription from util.ts
 * Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
 */
function localizeName(obj: JSONObject): JSONObject {
  const result: JSONObject = { ...obj };
  for (const key in result) {
    const { name, ...rest }: JSONObject = result[key];
    const localizedName: string | undefined = checkIfExist(name)
      ? getLocalizedText(name)
      : undefined;
    result[key] = {
      name: localizedName,
      ...rest,
    };
  }
  return result;
}

/**
 * Final adjustments for readability. Adds id field and makes new key
 */
function prettify(obj: JSONObject) {
  let result: JSONObject = {};
  let objCopy: JSONObject = { ...obj };
  for (const key in objCopy) {
    const {
      name,
      weapon_type,
      dps,
      penetration,
      cooldown_duration,
      travel_speed,
      range,
      ...otherFields
    }: any = objCopy[key];
    const id: string = key;
    const newKey: string = name;
    result[newKey] = {
      name: name,
      id: id,
      weapon_type: weapon_type,
      dps: dps,
      penetration: penetration,
      cooldown_duration: cooldown_duration,
      travel_speed: travel_speed,
      range: range,
      ...otherFields,
    };
  }
  return result;
}

export { weapons, rawWeapons };
