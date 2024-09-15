# sins2-ts-dataminer

Data miner for Sins of a Solar Empire 2. User dshaver has already created a version in Java- this is a typescript version.

# Instructions

## Prerequisites

- Have Node.js installed (I'm using version 20.17)

After cloning the repo and pulling it to your local machine:

- `cd` into the directory
- `npm install`
- `touch .env` and add environment variables (see below)
- `npm run dev`

Assuming your environment variables have been set, the program will run and create the JSON files in the directory above your local repo.

# .env

- `PATH_TO_SINS2_FOLDER` (set this to the path to your SINS2 folder)
- `LOCALIZED_FILE` (set this to "en.localized_text" if you speak english like I do)
