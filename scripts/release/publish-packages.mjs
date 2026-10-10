import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  readWorkspacePackageVersions,
  resolveDistTag,
  validateVersionTag,
  validateWorkspaceVersions,
} from "./release-utils.mjs";

export const publicPackages = [
  { name: "lineage-viewer", workspace: null },
  { name: "@lineage-viewer/domain-adapter", workspace: "@lineage-viewer/domain-adapter" },
  { name: "@lineage-viewer/react", workspace: "@lineage-viewer/react" },
];

const root = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const registry = (process.env.NPM_REGISTRY_URL || "https://registry.npmjs.org").replace(/\/$/u, "");

export function integrityForBytes(bytes) {
  return `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
}

export function classifyPublishedVersion({ name, version, expectedIntegrity, metadata }) {
  const published = metadata?.versions?.[version];
  if (!published) return { name, version, action: "publish" };

  const actualIntegrity = published.dist?.integrity;
  if (actualIntegrity !== expectedIntegrity) {
    throw new Error(
      `${name}@${version} already exists on npm with integrity ${actualIntegrity ?? "<missing>"}; ` +
        `refusing to publish a different tarball with an immutable version.`,
    );
  }
  return { name, version, action: "skip", integrity: expectedIntegrity };
}

export function createPublishPlan(packages, metadataByName, version) {
  return packages.map((pkg) =>
    classifyPublishedVersion({
      name: pkg.name,
      version,
      expectedIntegrity: pkg.integrity,
      metadata: metadataByName[pkg.name],
    }),
  );
}

function npmInvocation(args) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) return [process.execPath, [npmExecPath, ...args]];
  return [process.platform === "win32" ? "npm.cmd" : "npm", args];
}

function runNpm(args) {
  const [command, commandArgs] = npmInvocation(args);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `npm ${args.join(" ")} failed.`);
  }
  return result.stdout;
}

function viewMetadata(name) {
  const [command, commandArgs] = npmInvocation(["view", name, "--json", "--registry", registry]);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status === 0) return JSON.parse(result.stdout);
  if (/\bE404\b|404 Not Found/u.test(`${result.stdout}\n${result.stderr}`)) return null;
  throw new Error(
    result.stderr || result.stdout || `npm view ${name} failed with status ${result.status}.`,
  );
}

function packPackage(pkg, destination) {
  const args = ["pack", "--json", "--pack-destination", destination];
  if (pkg.workspace) args.push("--workspace", pkg.workspace);
  const report = JSON.parse(runNpm(args))[0];
  if (!report?.filename) throw new Error(`npm pack returned no tarball for ${pkg.name}.`);
  const tarball = join(destination, report.filename);
  return { ...pkg, tarball, integrity: integrityForBytes(readFileSync(tarball)) };
}

async function main() {
  const tag = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  const version = validateVersionTag(
    tag,
    validateWorkspaceVersions(readWorkspacePackageVersions()),
  );
  const distTag = resolveDistTag(version);
  const destination = await mkdtemp(join(tmpdir(), "lineage-viewer-release-"));

  try {
    const packages = publicPackages.map((pkg) => packPackage(pkg, destination));
    const metadataEntries = packages.map((pkg) => [pkg.name, viewMetadata(pkg.name)]);
    const plan = createPublishPlan(packages, Object.fromEntries(metadataEntries), version);
    for (const item of plan) process.stdout.write(`${item.action}: ${item.name}@${item.version}\n`);
    if (dryRun) return;

    for (const pkg of packages) {
      const item = plan.find((candidate) => candidate.name === pkg.name);
      if (item.action === "skip") continue;
      runNpm([
        "publish",
        pkg.tarball,
        "--provenance",
        "--access",
        "public",
        "--tag",
        distTag,
        "--registry",
        registry,
      ]);
    }
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
