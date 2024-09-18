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

interface AbilityObject extends GenericObject {}
interface JSONAbilities extends JSONObject {
  [key: string]: AbilityObject;
}

/* GET UNMANIPULATED ("RAW") ABILITY JSON OBJECTS */
const abilityFiles: fs.Dirent[] = getFilesByExtension(".ability");
const rawAbilities: JSONAbilities = {
  ...createJSONFromFiles(abilityFiles),
};

/* MANIPULATE INDIVIDUAL RESEARCH SUBJECT OBJECTS */
// Put functions in this flow that take as input a AbilityObject and output a AbilityObject
const manipulations = flow(removePropertiesFromObject);

// Include properties to filter out in the array below
const manipulatedAbilities: JSONAbilities = {
  ...objectMap(rawAbilities, (ability: AbilityObject): AbilityObject => {
    return manipulations(ability, [
      "version",
      "level_source",
      "gui",
      "min_required_unit_levels",
    ]);
  }),
};

/* ADJUSTMENTS TO ENTIRE JSON AND GET FINAL OUTPUT  */
const abilities = { ...prettify(manipulatedAbilities) };

/* FUNCTIONS */
/**
 * Final adjustments for readability. Adds id, and re-orders fields.
 * Takes in the entire research subjects JSON object. Also replaces "Trader" with "TEC".
 * Uses capitalize from util.ts. Not included in our flow.
 */
function prettify(obj: JSONAbilities): JSONAbilities {
  let result: JSONAbilities = {};
  let researchSubjectsCopy: JSONAbilities = { ...obj };
  for (const key in researchSubjectsCopy) {
    const { ...rest }: JSONAbilities = researchSubjectsCopy[key];
    let id: string = key;
    let newKey: string = key
      .split("_")
      .map((word: string) => capitalize(word))
      .join(" ");
    result[newKey] = {
      id: id,
      ...rest,
    };
  }
  return result;
}

export { abilities, rawAbilities };
