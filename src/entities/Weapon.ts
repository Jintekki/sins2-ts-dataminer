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

interface WeaponObject extends GenericObject {}
interface JSONWeapons extends JSONObject {
  [key: string]: WeaponObject;
}

/* GET UNMANIPULATED ("RAW") WEAPON JSON OBJECTS */
const weaponFiles: fs.Dirent[] = getFilesByExtension(".weapon");
const rawWeapons: JSONWeapons = {
  ...createJSONFromFiles(weaponFiles),
};

/* MANIPULATIONS AND GET FINAL RESEARCH SUBJECT JSON OBJECTS */
const manipulations = flow(
  removePropertiesFromObject,
  localizeName,
  getTravelSpeed,
  calculateDPS
);

const manipulatedWeapons: JSONWeapons = {
  ...objectMap(rawWeapons, (researchSubject: WeaponObject): WeaponObject => {
    return manipulations(researchSubject, [
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
    ]);
  }),
};

const weapons: JSONWeapons = { ...prettify(manipulatedWeapons) };

/* FUNCTIONS */
/**
 * Calculate DPS. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
 * Uses roundTo from util.ts
 */
function calculateDPS(obj: WeaponObject): WeaponObject {
  let result: WeaponObject = { ...obj };
  let { ...rest }: WeaponObject = result;
  let dps: number = 0;
  if (result.weapon_type === "normal") {
    dps = ((60 / result.cooldown_duration) * result.damage) / 60;
  } else if (result.weapon_type === "planet_bombing") {
    dps = ((60 / result.cooldown_duration) * result.bombing_damage) / 60;
  }
  dps = Number.parseFloat(dps.toFixed(1));
  result = {
    ...rest,
    dps: dps,
  };
  return result;
}

/**
 * Get travel speed. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
 * Uses from util.ts
 */
function getTravelSpeed(obj: WeaponObject): WeaponObject {
  let result: WeaponObject = { ...obj };
  let travelSpeed: number | undefined;
  const { firing, ...rest }: WeaponObject = result;
  if (firing) {
    travelSpeed = firing.travel_speed ? firing.travel_speed : 0;
  }

  result = {
    ...rest,
    travel_speed: travelSpeed,
  };
  return result;
}

/**
 * Find localized text for name and description.
 * Uses getLocalizedText from util.ts
 * Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
 */
function localizeName(obj: WeaponObject): WeaponObject {
  let result: WeaponObject = { ...obj };
  const { name, ...rest }: WeaponObject = result;
  const localizedName: string | undefined = name
    ? getLocalizedText(name)
    : undefined;
  result = {
    name: localizedName,
    ...rest,
  };
  return result;
}

/**
 * Final adjustments for readability. Adds id field and makes new key
 */
function prettify(obj: JSONWeapons): JSONWeapons {
  console.log(obj);
  let result: JSONWeapons = {};
  let objCopy: JSONWeapons = { ...obj };
  for (const key in objCopy) {
    const {
      name,
      weapon_type,
      dps,
      penetration,
      cooldown_duration,
      travel_speed,
      range,
      ...rest
    }: WeaponObject = objCopy[key];
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
      ...rest,
    };
  }
  return result;
}

function getWeaponById(id: string, weapons: JSONWeapons): WeaponObject {
  let weaponsCopy = { ...weapons };
  let result = {};
  for (const key in weaponsCopy) {
    if (weaponsCopy[key].id === id) {
      result = { ...weaponsCopy[key] };
    }
  }
  return result;
}

export { weapons, rawWeapons, getWeaponById };
