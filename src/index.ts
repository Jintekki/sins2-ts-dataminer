/* index.ts: writes JSON to files */
import fs from "fs";
import getResearchSubjects, {
  getRawResearchSubjects,
} from "./entities/ResearchSubject";
import { getShipUnits, getRawShipUnits } from "./entities/Units";

/* Units */
// Wiki-ready units
fs.writeFile("../../shipUnitsWiki.json", getShipUnits(), (err) => {
  if (err) {
    console.error("Error writing file:", err);
  } else {
    console.log("Wiki-ready units file has been written successfully");
  }
});
// Raw units
fs.writeFile("../../shipUnitsRaw.json", getRawShipUnits(), (err) => {
  if (err) {
    console.error("Error writing file:", err);
  } else {
    console.log("Raw units file has been written successfully");
  }
});
/* Reserach Subjects */
// Wiki-ready research subjects
fs.writeFile(
  "../../researchSubjectsWiki.json",
  getResearchSubjects(),
  (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("Wiki-ready subjects file has been written successfully");
    }
  }
);
// Raw reserach subjects
fs.writeFile(
  "../../researchSubjectsRaw.json",
  getRawResearchSubjects(),
  (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("Raw research subjects file has been written successfully");
    }
  }
);
