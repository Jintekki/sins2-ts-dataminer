import { createRawJSON, getLocalizedText, getRawFiles, roundTo } from "../util";

// Unmanipulated research subject JSON objects.
const rawWeaponsJSON = createRawJSON(getRawFiles(".weapon"));

// Most of our data manipulation will be done on this object.
let weaponsJSON: any = { ...rawWeaponsJSON };

// Filter out irrelevant fields. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
for (const unit in weaponsJSON) {
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
  }: any = weaponsJSON[unit];
  weaponsJSON[unit] = { ...relevantFields };
}

// Find localized text for name.
// Be sure to have LOCALIZED_FILE="en.localized_text" set in your .env.
for (const weapon in weaponsJSON) {
  const { name, ...otherFields }: any = weaponsJSON[weapon];
  const localizedName = getLocalizedText(name);
  weaponsJSON[weapon] = {
    name: localizedName,
    ...otherFields,
  };
}

// Get travel speed. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
for (const weapon in weaponsJSON) {
  const { firing, ...otherFields }: { firing: any } = weaponsJSON[weapon];
  let travelSpeed = 0;
  try {
    travelSpeed = firing.travel_speed;
  } catch (error) {}

  weaponsJSON[weapon] = {
    ...otherFields,
    travel_speed: travelSpeed,
  };
}

// Calculate DPS. Note: At the time of writing, I'm trying to make this as close to dshaver's as possible.
for (const weapon in weaponsJSON) {
  const { ...fields }: { firing: any } = weaponsJSON[weapon];
  let dps: number = 0;
  if (weaponsJSON[weapon].weapon_type === "normal") {
    dps =
      ((60 / weaponsJSON[weapon].cooldown_duration) *
        weaponsJSON[weapon].damage) /
      60;
  } else if (weaponsJSON[weapon].weapon_type === "planet_bombing") {
    dps =
      ((60 / weaponsJSON[weapon].cooldown_duration) *
        weaponsJSON[weapon].bombing_damage) /
      60;
  }
  dps = roundTo(dps, 1);
  weaponsJSON[weapon] = {
    ...fields,
    dps: dps,
  };
}

// Final adjustments for readability. Human readable key, id, and re-orders fields.
const prettifiedWeaponsJSON: any =
  createPrettifiedResarchSubjectsJSON(weaponsJSON);

function createPrettifiedResarchSubjectsJSON(weaponsJSON: any) {
  let prettifiedWeaponsJSON: any = {};
  for (const weapon in weaponsJSON) {
    const {
      name,
      weapon_type,
      dps,
      penetration,
      cooldown_duration,
      travel_speed,
      range,
      ...otherFields
    }: any = weaponsJSON[weapon];
    const id: string = weapon;
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
