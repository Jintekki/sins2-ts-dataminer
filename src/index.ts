/* index.ts: writes JSON to files */
import fs from "fs";
import {
  researchSubjects,
  rawResearchSubjects,
} from "./entities/ResearchSubject";
import { rawWeapons, weapons } from "./entities/Weapon";
// import { rawUnits, shipUnits } from "./entities/Unit";
import { JSONObject } from "./util";

writeFiles([
  [researchSubjects, "ResearchSubjectsWiki"],
  [rawResearchSubjects, "ResearchSubjectsRaw"],
  // [shipUnits, "ShipUnitsWiki"],
  // [rawUnits, "UnitsRaw"],
  [weapons, "WeaponsWiki"],
  [rawWeapons, "WeaponsRaw"],
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
