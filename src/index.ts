import fs from "fs";
import {
  researchSubjects,
  rawResearchSubjects,
} from "./entities/ResearchSubjects";
import { rawWeapons, weapons } from "./entities/Weapons";
import { rawUnits, rawShipUnits, shipUnits } from "./entities/Units.ShipUnits";
import {
  structureUnits,
  rawStructureUnits,
} from "./entities/Units.StructureUnits";
import {
  rawUnitItems,
  rawPlanetItems,
  planetItems,
} from "./entities/UnitItems.PlanetItems";
import { abilities, rawAbilities } from "./entities/Abilities";
import {
  actionDataSources,
  rawActionDataSources,
} from "./entities/ActionDataSources";
import { JSONObject } from "./util";

// Write JSON to files
writeFiles([
  // [researchSubjects, "ResearchSubjectsWiki"],
  // [rawResearchSubjects, "ResearchSubjectsRaw"],
  // [rawUnits, "UnitsRaw"],
  // [rawShipUnits, "ShipUnitsRaw"],
  // [shipUnits, "ShipUnitsWiki"],
  // [weapons, "WeaponsWiki"],
  // [rawWeapons, "WeaponsRaw"],
  // [structureUnits, "StructuresWiki"],
  // [rawStructureUnits, "StructuresRaw"],
  // [rawUnitItems, "UnitItemsRaw"],
  // [rawPlanetItems, "PlanetItemsRaw"],
  // [planetItems, "PlanetItemsWiki"],
  [rawAbilities, "AbilitiesRaw"],
  [abilities, "AbilitiesWiki"],
  [rawActionDataSources, "ActionDataSourcesRaw"],
  [actionDataSources, "ActionDataSourcesWiki"],
]);

function writeFiles(jsonToWrite: Array<[JSONObject, string]>): void {
  jsonToWrite.forEach((fileToWrite: [JSONObject, string]) => {
    fs.writeFile(
      `src/output/${fileToWrite[1]}.json`,
      JSON.stringify(fileToWrite[0], null, 2),
      (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log(`${fileToWrite[1]} file has been written successfully`);
        }
      }
    );
  });
}

// Checks to verify no data was lost (usually happens during prettification)
// Object.keys(researchSubjects).length === Object.keys(rawResearchSubjects).length
//   ? console.log("No research subjects were lost")
//   : console.log("WARNING: Research subjects missing!");

// Object.keys(weapons).length === Object.keys(rawWeapons).length
//   ? console.log("No weapons were lost")
//   : console.log("WARNING: Weapons missing!");

// Object.keys(shipUnits).length === Object.keys(rawShipUnits).length
//   ? console.log("No ship units were lost")
//   : console.log("WARNING: Ship units missing!");

// Object.keys(structureUnits).length === Object.keys(rawStructureUnits).length
//   ? console.log("No strcuture units were lost")
//   : console.log("WARNING: Structure units missing!");

// Object.keys(planetItems).length === Object.keys(rawPlanetItems).length
//   ? console.log("No planet items were lost")
//   : console.log("WARNING: Planet Items missing!");

Object.keys(abilities).length === Object.keys(rawAbilities).length
  ? console.log("No abilities were lost")
  : console.log("WARNING: Abilities missing!");

Object.keys(actionDataSources).length ===
Object.keys(rawActionDataSources).length
  ? console.log("No action data sources were lost")
  : console.log("WARNING: Action data sources missing!");
