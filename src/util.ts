/* util.ts: utility and common functions that are shared throughout several entitiy files */
import fs from "fs";
import path from "path";

const localizedTextFile = `${process.env.PATH_TO_SINS2_FOLDER}\\localized_text\\${process.env.LOCALIZED_FILE}`;
const entitiesFolder = `${process.env.PATH_TO_SINS2_FOLDER}\\entities`;

// Capitalizes the first letter of a word.
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function checkIfPropertyExist(property: any): boolean {
  try {
    return property !== undefined ? true : false;
  } catch (error) {
    return false;
  }
}

function createRawJSON(rawFiles: fs.Dirent[]) {
  let rawJSONObject: any = {};
  rawFiles.forEach((file: any) => {
    rawJSONObject[`${file.name.split(".")[0]}`] = JSON.parse(
      fs.readFileSync(`${entitiesFolder}/${file.name}`, "utf-8").toString()
    );
  });
  return rawJSONObject;
}

/* Replaces "price" and "exotic_price" with individual price properties, along with build time and supply cost */
function getAllCost(pricedObjectsJSON: any) {
  let resultingJSON: any = { ...pricedObjectsJSON };
  for (const pricedObjectKey in resultingJSON) {
    let props: any = { ...resultingJSON[pricedObjectKey] };
    let credits: number | undefined;
    let metal: number | undefined;
    let crystal: number | undefined;
    let andvar: number | undefined;
    let tauranite: number | undefined;
    let indurium: number | undefined;
    let kalanide: number | undefined;
    let quarnium: number | undefined;
    let buildTime: number | undefined;
    let supplyCost: number | undefined;
    const { build, ...rest }: { build: object | undefined } = props;
    if (checkIfPropertyExist(props.build)) {
      props = { ...build };
      const {
        build_time,
        supply_cost,
      }: { build_time: number | undefined; supply_cost: number | undefined } =
        props;
      buildTime = checkIfPropertyExist(build_time) ? build_time : undefined;
      supplyCost = checkIfPropertyExist(supply_cost) ? supply_cost : undefined;
    } else {
      props = { ...rest };
    }
    const {
      price,
      exotic_price,
      build_kind,
      build_group_id,
      ...remainingFields
    }: any = props;
    if (checkIfPropertyExist(price)) {
      credits = checkIfPropertyExist(price.credits) ? price.credits : undefined;
      metal = checkIfPropertyExist(price.metal) ? price.metal : undefined;
      crystal = checkIfPropertyExist(price.crystal) ? price.crystal : undefined;
    }
    if (checkIfPropertyExist(exotic_price)) {
      andvar = getExoticPrice(getExoticAliasConversion("andvar"), exotic_price);
      tauranite = getExoticPrice(
        getExoticAliasConversion("tauranite"),
        exotic_price
      );
      indurium = getExoticPrice(
        getExoticAliasConversion("indurium"),
        exotic_price
      );
      kalanide = getExoticPrice(
        getExoticAliasConversion("kalanide"),
        exotic_price
      );
      quarnium = getExoticPrice(
        getExoticAliasConversion("quarnium"),
        exotic_price
      );
    }
    props = {
      ...remainingFields,
      build_time: buildTime,
      supply_cost: supplyCost,
      credits,
      metal,
      crystal,
      andvar,
      tauranite,
      indurium,
      kalanide,
      quarnium,
    };
    resultingJSON[pricedObjectKey] = { ...props };
  }
  return { ...resultingJSON };
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
function getExoticPrice(exoticAlias: string, exoticsArray: any[]): number {
  let price: number = 0;
  exoticsArray.forEach(
    ({ exotic_type, count }: { exotic_type: string; count: number }) => {
      if (exotic_type === exoticAlias) {
        price = count;
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

function getRawFiles(extension: string) {
  const rawFiles = fs
    .readdirSync(entitiesFolder, {
      withFileTypes: true,
    })
    .filter((file: any) => {
      return path.extname(file.name) === extension;
    });
  return rawFiles;
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
  checkIfPropertyExist,
  createRawJSON,
  getAllCost,
  getLocalizedText,
  getRawFiles,
  roundTo,
};
