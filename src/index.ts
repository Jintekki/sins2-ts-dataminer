import fs from "fs";
import getResearchSubjects, { getRawResearchSubjects } from "./ResearchSubject";
import getUnits, { getRawUnits } from "./Units";

// Write units to a file.
fs.writeFile("../../unitsWiki.json", getUnits(), (err) => {
  if (err) {
    console.error("Error writing file:", err);
  } else {
    console.log("Wiki-ready units file has been written successfully");
  }
});

// Write raw unit file.
fs.writeFile("../../unitsRaw.json", getRawUnits(), (err) => {
  if (err) {
    console.error("Error writing file:", err);
  } else {
    console.log("Raw units file has been written successfully");
  }
});

// Write research subjects to a file.
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

// Write raw research subject file.
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
