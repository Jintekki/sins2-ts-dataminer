import fs from "fs";

const localizedTextFile = `${process.env.PATH_TO_SINS2_FOLDER}\\localized_text\\${process.env.LOCALIZED_FILE}`;

// Capitalizes the first letter of a word.
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

// Example: getExoticPrice(andvar, researchSubject).
function getExoticPrice(exoticAlias: string, exoticsArray: any[]): number {
  let count = 0;
  exoticsArray.forEach(
    ({ exotic_type, price }: { exotic_type: string; price: number }) => {
      if (exotic_type === exoticAlias) {
        count = price;
      }
    }
  );
  return count;
}

// Be sure your PATH_TO_SINS2_FOLDER and LOCALIZED_FILE environment variables are set.
function getLocalizedText(searchString: string): string {
  const localizedText = JSON.parse(
    fs.readFileSync(localizedTextFile, "utf-8").toString()
  );
  return localizedText[`${searchString}`];
}

export {
  capitalize,
  getExoticAliasConversion,
  getExoticPrice,
  getLocalizedText,
};
