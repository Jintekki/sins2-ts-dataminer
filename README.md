# sins2-ts-dataminer

Data miner for Sins of a Solar Empire 2. User dshaver has already created a version in Java- this is a typescript version.

This version attempts to keep every entity to a single file, and attempts to follow closer to a functional programming paradigm.
Types are mostly used for clarity and explanatory purposes. Once you understand one file, you should understand the rest.
Most files only borrow utility functions from util.ts. Unit files rely on Weapons.ts.

# Instructions

## Prerequisites

- Have Node.js installed (I'm using version 20.17)

After cloning the repo and pulling it to your local machine:

- `cd` into the directory
- `npm install`
- `touch .env` and add environment variables (see below)
- `npm run dev`

Assuming your environment variables have been set, the program will run and create the JSON files in the output directory.
The program will automatically re-run whenever you save as long as you keep the console up.

# .env

- `PATH_TO_SINS2_FOLDER` (set this to the path to your SINS2 folder. For me, this is set to "C:\Program Files (x86)\Steam\steamapps\common\Sins2")
- `LOCALIZED_FILE` (set this to "en.localized_text" if you speak english like I do)

# Output Files

Files that are practically untouched from the game files are labeled as "raw" and files that are meant to be uploaded to StrategyWiki are labeled as "wiki":

- AbilitiesRaw.json
- AbilitiesWiki.json (WIP)
- ActionDataSourcesRaw
- ActionDataSourcesWiki (WIP)
- PlanetItemsRaw.json
- PlanetItems.json
- ResearchSubjectsRaw.json
- ResearchSubjectsWiki.json
- ShipUnitsRaw.json
- ShipUnitsWiki.json
- StructuresRaw.json
- StructuresWiki.json
- UnitItemsRaw.json
- UnitsRaw.json
- WeaponsRaw.json
- WeaponsWiki.json

# Packages Used

- `fp-ts`: Used to organize functions in `flow`
