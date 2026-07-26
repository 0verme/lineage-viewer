import {
  readWorkspacePackageVersions,
  validateVersionTag,
  validateWorkspaceVersions,
} from "./release-utils.mjs";

const tag = process.argv[2];
const version = validateVersionTag(tag, validateWorkspaceVersions(readWorkspacePackageVersions()));
process.stdout.write(`${version}\n`);
