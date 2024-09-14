import fs from "fs";

const localizedTextFile = `${process.env.PATH_TO_SINS2_FOLDER}\\localized_text\\${process.env.LOCALIZED_FILE}`;

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
