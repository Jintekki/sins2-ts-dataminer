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

interface ActionDataSourceObject extends GenericObject {}
interface JSONActionDataSources extends JSONObject {
  [key: string]: ActionDataSourceObject;
}

/* GET UNMANIPULATED ("RAW") ACTION DATA SOURCE JSON OBJECTS */
const actionDataSourceFiles: fs.Dirent[] = getFilesByExtension(
  ".action_data_source"
);
const rawActionDataSources: JSONActionDataSources = {
  ...createJSONFromFiles(actionDataSourceFiles),
};

/* MANIPULATE INDIVIDUAL ACTION DATA SOURCE OBJECTS */
// Put functions in this flow that take as input a ActionDataSourceObject and output a ActionDataSourceObject
const transforms = flow(removePropertiesFromObject);

// Include properties to filter out in the array below
const transformedActionDataSources: JSONActionDataSources = {
  ...objectMap(
    rawActionDataSources,
    (actionDataSource: ActionDataSourceObject): ActionDataSourceObject => {
      return transforms(actionDataSource, [
        "version",
        "level_source",
        "gui",
        "min_required_unit_levels",
      ]);
    }
  ),
};

/* ADJUSTMENTS TO ENTIRE JSON AND GET FINAL OUTPUT  */
const actionDataSources = { ...prettify(transformedActionDataSources) };

/* FUNCTIONS */
/**
 * Final adjustments for actionDataSources. Adds id, and re-orders fields.
 * Takes in the entire research subjects JSON object. Also replaces "Trader" with "TEC".
 * Uses capitalize from util.ts. Not included in our flow.
 */
function prettify(obj: JSONActionDataSources): JSONActionDataSources {
  let result: JSONActionDataSources = {};
  let actionDataSourceCopy: JSONActionDataSources = { ...obj };
  for (const key in actionDataSourceCopy) {
    const { ...rest }: JSONActionDataSources = actionDataSourceCopy[key];
    let id = key;
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

function getActionSourceById(
  id: string,
  actionDataSources: JSONActionDataSources
): ActionDataSourceObject | undefined {
  let actionDataSourcesCopy = { ...actionDataSources };
  let result;
  for (const key in actionDataSourcesCopy) {
    if (actionDataSourcesCopy[key].id === id) {
      result = { ...actionDataSourcesCopy[key] };
    }
  }
  return result;
}

export {
  actionDataSources,
  rawActionDataSources,
  getActionSourceById,
  ActionDataSourceObject,
};
