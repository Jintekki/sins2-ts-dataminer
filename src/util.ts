/* util.ts: utility and common functions that are shared throughout several entitiy files */
import fs from "fs";
import path from "path";

interface GenericObject extends Object {
  [k: string]: any | null;
}

interface JSONObject extends GenericObject {}

const localizedTextFile = `${process.env.PATH_TO_SINS2_FOLDER}\\localized_text\\${process.env.LOCALIZED_FILE}`;
const entitiesFolder = `${process.env.PATH_TO_SINS2_FOLDER}\\entities`;

// Capitalizes the first letter of a word.
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function checkIfExist(property: any): boolean {
  try {
    return property !== undefined ? true : false;
  } catch (error) {
    return false;
  }
}

function createJSONFromFiles(files: fs.Dirent[]) {
  let result: any = {};
  files.forEach((file: any) => {
    result[`${file.name.split(".")[0]}`] = JSON.parse(
      fs.readFileSync(`${entitiesFolder}/${file.name}`, "utf-8").toString()
    );
  });
  return result;
}

// Exotic resources go by different names in the JSON.
function getExoticAliasConversion(exoticAlias: string): string {
  switch (exoticAlias.toUpperCase()) {
    case "ECONOMIC":
      return "Andvar";
    case "OFFENSE":
      return "Tauranite";
    case "DEFENSE":
      return "Indurium";
    case "UTLITY":
      return "Kalanide";
    case "ULTIMATE":
      return "Quarnium";
    case "ANDVAR":
      return "economic";
    case "TAURANITE":
      return "offense";
    case "INDURIUM":
      return "defense";
    case "KALANIDE":
      return "utility";
    case "QUARNIUM":
      return "ultimate";
  }
  return "Exotic not found";
}

// Example: getExoticPrice(andvar, object)
// Used in get
function getExoticPrice(
  exoticAlias: string,
  exoticsArray: any[]
): number | undefined {
  let price: number | undefined;
  exoticsArray.forEach(
    ({ exotic_type, count }: { exotic_type: string; count: number }) => {
      if (exotic_type === exoticAlias) {
        price = count ? count : undefined;
      }
    }
  );
  return price;
}

// Be sure your PATH_TO_SINS2_FOLDER and LOCALIZED_FILE environment variables are set.
function getLocalizedText(searchString: string): string {
  const localizedText = JSON.parse(
    fs.readFileSync(localizedTextFile, "utf-8").toString()
  );
  return localizedText[`${searchString}`];
}

function getFilesByExtension(extension: string) {
  const files = fs
    .readdirSync(entitiesFolder, {
      withFileTypes: true,
    })
    .filter((file: fs.Dirent) => {
      return path.extname(file.name) === extension;
    });
  return files;
}

function removePropertiesFromObject(
  obj: GenericObject,
  props: Array<string>
): GenericObject {
  let result: GenericObject = { ...obj };
  props.forEach((prop: string) => {
    delete result[prop];
  });

  return result;
}

function objectMap<Value, Function>(
  obj: { [key: string]: Value },
  fn: (value: Value, key: string, index: number) => Function
) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)])
  );
}

// Helper function for more accurate rounding
function roundTo(n: number, digits: number) {
  if (digits === undefined) {
    digits = 0;
  }
  let multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator).toFixed(11));
  return Math.round(n) / multiplicator;
}

export {
  capitalize,
  checkIfExist,
  createJSONFromFiles,
  getExoticAliasConversion,
  getExoticPrice,
  getLocalizedText,
  getFilesByExtension,
  GenericObject,
  JSONObject,
  entitiesFolder,
  objectMap,
  removePropertiesFromObject,
  roundTo,
};
