import { resolveDistTag, versionFromTag } from "./release-utils.mjs";

process.stdout.write(`${resolveDistTag(versionFromTag(process.argv[2]))}\n`);
