import { readFileSync } from "node:fs";

const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

export function versionFromTag(tag) {
  if (typeof tag !== "string" || !tag.startsWith("v") || !semver.test(tag.slice(1))) {
    throw new Error(
      `Expected a version tag in the form v<semver>; received ${JSON.stringify(tag)}.`,
    );
  }
  return tag.slice(1);
}

export function validateVersionTag(tag, packageVersion) {
  const version = versionFromTag(tag);
  if (version !== packageVersion) {
    throw new Error(
      `Tag version ${version} does not match package.json version ${packageVersion}.`,
    );
  }
  return version;
}

export function resolveDistTag(version) {
  const match = version.match(semver);
  if (!match)
    throw new Error(`Expected a valid semantic version; received ${JSON.stringify(version)}.`);
  const prerelease = match[4];
  if (!prerelease) return "latest";
  const identifier = prerelease.split(".")[0];
  const tags = { alpha: "alpha", beta: "beta", rc: "next" };
  if (!(identifier in tags)) {
    throw new Error(`Unsupported prerelease identifier ${JSON.stringify(identifier)}.`);
  }
  return tags[identifier];
}

export function extractChangelogEntry(markdown, version) {
  const heading = new RegExp(
    `^## \\[(?:v?${version.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")})\\](?:\\s+-.*)?\\s*$`,
    "m",
  );
  const match = heading.exec(markdown);
  if (!match || match.index === undefined)
    throw new Error(`No CHANGELOG entry found for ${version}.`);
  const start = match.index + match[0].length;
  const nextHeading = /^##\s/m.exec(markdown.slice(start));
  return markdown.slice(start, nextHeading ? start + nextHeading.index : undefined).trim();
}

export function readPackageVersion() {
  return JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version;
}
