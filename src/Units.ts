import {
  capitalize,
  createRawJSON,
  expandPrices,
  expandExotics,
  getLocalizedText,
  getRawFiles,
} from "./util";

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

export default function getUnits() {
  return JSON.stringify(unitsJSON, null, 2);
}
