import { readFileSync } from "node:fs";

import { extractChangelogEntry, versionFromTag } from "./release-utils.mjs";

const changelog = readFileSync(new URL("../../CHANGELOG.md", import.meta.url), "utf8");
process.stdout.write(`${extractChangelogEntry(changelog, versionFromTag(process.argv[2]))}\n`);
