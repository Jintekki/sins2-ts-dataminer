import fs from "fs";
import getResearchSubjects from "./ResearchSubject";

// Write research subjects to a file.
fs.writeFile(
  "../../researchSubjectsWiki.json",
  getResearchSubjects(),
  (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("Research subjects file has been written successfully");
    }
  }
);

// TO-DO: Upload research subjects to directly to wiki.
