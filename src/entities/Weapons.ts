import { createRawJSON, getLocalizedText, getRawFiles, roundTo } from "../util";

// Unmanipulated research subject JSON objects.
const rawWeaponsJSON = createRawJSON(getRawFiles(".weapon"));

// Most of our data manipulation will be done on this object.
let weaponsJSON: any = { ...rawWeaponsJSON };

// Filter out irrelevant fields. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
for (const weaponKey in weaponsJSON) {
  const {
    version,
    pitch_speed,
    yaw_speed,
    pitch_firing_tolerance,
    yaw_firing_tolerance,
    uniforms_target_filter_id,
    attack_target_type_groups,
    damage_affect_type,
    tags,
    acquire_target_logic,
    effects,
    turret,
    muzzle_positions,
    burst_pattern,
    ...relevantFields
  }: any = weaponsJSON[weaponKey];
  weaponsJSON[weaponKey] = { ...relevantFields };
}

// Find localized text for name.
// Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
for (const weaponKey in weaponsJSON) {
  const { name, ...otherFields }: any = weaponsJSON[weaponKey];
  const localizedName = getLocalizedText(name);
  weaponsJSON[weaponKey] = {
    name: localizedName,
    ...otherFields,
  };
}

// Get travel speed. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
for (const weaponKey in weaponsJSON) {
  const { firing, ...otherFields }: { firing: any } = weaponsJSON[weaponKey];
  let travelSpeed = 0;
  try {
    travelSpeed = firing.travel_speed;
  } catch (error) {}

  weaponsJSON[weaponKey] = {
    ...otherFields,
    travel_speed: travelSpeed,
  };
}

// Calculate DPS. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
for (const weaponKey in weaponsJSON) {
  const { ...fields }: { firing: any } = weaponsJSON[weaponKey];
  let dps: number = 0;
  if (weaponsJSON[weaponKey].weapon_type === "normal") {
    dps =
      ((60 / weaponsJSON[weaponKey].cooldown_duration) *
        weaponsJSON[weaponKey].damage) /
      60;
  } else if (weaponsJSON[weaponKey].weapon_type === "planet_bombing") {
    dps =
      ((60 / weaponsJSON[weaponKey].cooldown_duration) *
        weaponsJSON[weaponKey].bombing_damage) /
      60;
  }
  dps = roundTo(dps, 1);
  weaponsJSON[weaponKey] = {
    ...fields,
    dps: dps,
  };
}

// Final adjustments for readability. Human readable key, id, and re-orders fields.
const prettifiedWeaponsJSON: any =
  createPrettifiedResarchSubjectsJSON(weaponsJSON);

function createPrettifiedResarchSubjectsJSON(weaponsJSON: any) {
  let prettifiedWeaponsJSON: any = {};
  for (const weaponKey in weaponsJSON) {
    const {
      name,
      weapon_type,
      dps,
      penetration,
      cooldown_duration,
      travel_speed,
      range,
      ...otherFields
    }: any = weaponsJSON[weaponKey];
    const id: string = weaponKey;
    const key: string = name;
    prettifiedWeaponsJSON[key] = {
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
  return prettifiedWeaponsJSON;
}

export function getRawWeapons() {
  return JSON.stringify(rawWeaponsJSON, null, 2);
}

export function getWeaponById(id: string, weaponsJSON: any): any {
  let result = {};
  for (const weapon in weaponsJSON) {
    if (weaponsJSON[weapon].id === id) {
      result = { ...weaponsJSON[weapon] };
    }
  }
  return result;
}

export default function getWeapons() {
  return JSON.stringify(prettifiedWeaponsJSON, null, 2);
}
