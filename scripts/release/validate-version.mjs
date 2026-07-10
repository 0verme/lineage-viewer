import { readPackageVersion, validateVersionTag } from "./release-utils.mjs";

const tag = process.argv[2];
const version = validateVersionTag(tag, readPackageVersion());
process.stdout.write(`${version}\n`);
