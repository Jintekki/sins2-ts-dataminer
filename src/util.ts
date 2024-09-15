/* util.ts: utility and common functions that are shared throughout several entitiy files */
import fs from "fs";
import path from "path";

const localizedTextFile = `${process.env.PATH_TO_SINS2_FOLDER}\\localized_text\\${process.env.LOCALIZED_FILE}`;
const entitiesFolder = `${process.env.PATH_TO_SINS2_FOLDER}\\entities`;

// Capitalizes the first letter of a word.
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

// Expand exotics cost (finds "exotics" and "exotic_price" arrays and extracts the prices).
function expandExotics(exoticPricedObjectsJSON: any) {
  const resultingJSON: any = { ...exoticPricedObjectsJSON };
  for (const exoticPricedObject in resultingJSON) {
    const { exotic_price, ...otherFields }: any =
      resultingJSON[exoticPricedObject];
    if (exotic_price?.length) {
      let andvar: number = 0;
      let tauranite: number = 0;
      let indurium: number = 0;
      let kalanide: number = 0;
      let quarnium: number = 0;
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
      resultingJSON[exoticPricedObject] = {
        ...otherFields,
        andvar: andvar,
        tauranite: tauranite,
        indurium: indurium,
        kalanide: kalanide,
        quarnium: quarnium,
      };
    }
  }
  return resultingJSON;
}

// Expand credit, metal, and crystal cost (replaces "price" field with credits, metal, and crystal fields).
function expandPrices(pricedObjectsJSON: any) {
  const resultingJSON: any = { ...pricedObjectsJSON };
  for (const pricedObject in resultingJSON) {
    const { price, ...otherFields }: any = resultingJSON[pricedObject];
    if (price) {
      const credits: number = resultingJSON[pricedObject].price.credits;
      const metal: number = resultingJSON[pricedObject].price.metal;
      const crystal: number = resultingJSON[pricedObject].price.crystal;
      resultingJSON[pricedObject] = {
        ...otherFields,
        credits: credits,
        metal: metal,
        crystal: crystal,
      };
    }
  }
  return resultingJSON;
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

function roundTo(n: number, digits: number) {
  if (digits === undefined) {
    digits = 0;
  }

  var multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator).toFixed(11));
  return Math.round(n) / multiplicator;
}

export {
  capitalize,
  createRawJSON,
  expandPrices,
  expandExotics,
  getLocalizedText,
  getRawFiles,
  roundTo,
};
