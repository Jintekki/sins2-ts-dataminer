import {
  capitalize,
  createJSONFromFiles,
  GenericObject,
  getLocalizedText,
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

/* MANIPULATE INDIVIDUAL WEAPON OBJECTS */
// Put functions in this flow that take as input a WeaponObject and output a WeaponObject
const transforms = flow(
  removePropertiesFromObject,
  localizeName,
  getTravelSpeed,
  calculateDPS
);

// Include properties to filter out in the array below
const transformedWeapons: JSONWeapons = {
  ...objectMap(rawWeapons, (weapon: WeaponObject): WeaponObject => {
    return transforms(weapon, [
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

/* ADJUSTMENTS TO ENTIRE JSON AND GET FINAL OUTPUT  */
const weapons: JSONWeapons = { ...prettify(transformedWeapons) };

/* FUNCTIONS */
/**
 * Calculate DPS. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
 * Uses roundTo from util.ts. Included in our flow.
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
 * Uses from util.ts. Included in our flow.
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
 * Uses getLocalizedText from util.ts. Included in our flow.
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
 * Final adjustments for readability. Adds id field and makes new key.
 * Not included in our flow.
 */
function prettify(obj: JSONWeapons): JSONWeapons {
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
    let id: string = key;
    let race: string = key.split("_")[0];
    race = race === "trader" ? "TEC" : capitalize(race);
    let newKey = key
      .split("_")
      .map((word: string) => capitalize(word))
      .join(" ");
    newKey = newKey.replace("Trader", "TEC");
    result[newKey] = {
      name: name,
      id: id,
      race: race,
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

function getWeaponById(
  id: string,
  weapons: JSONWeapons
): WeaponObject | undefined {
  let weaponsCopy = { ...weapons };
  let result;
  for (const key in weaponsCopy) {
    if (weaponsCopy[key].id === id) {
      result = { ...weaponsCopy[key] };
    }
  }
  return result;
}

export { weapons, rawWeapons, getWeaponById, JSONWeapons, WeaponObject };
