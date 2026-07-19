import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error("npm_execpath is unavailable; run this script through npm.");
}

const result = spawnSync(process.execPath, [npmCli, "pack", "--dry-run", "--json"], {
  encoding: "utf8",
});

if (result.status !== 0) {
  throw new Error(result.stderr || "npm pack --dry-run failed.");
}

const reports = JSON.parse(result.stdout);
const report = reports[0];

if (!report || !Array.isArray(report.files)) {
  throw new Error("npm pack returned an unexpected report.");
}

const paths = report.files.map((file) => file.path);
const forbidden = [
  /^\.reference(?:\/|$)/u,
  /^tests?(?:\/|$)/u,
  /(?:^|\/)coverage(?:\/|$)/u,
  /(?:^|\/)playwright-report(?:\/|$)/u,
  /(?:^|\/)test-results(?:\/|$)/u,
  /(?:^|\/)\.env(?:\.|$)/u,
  /\.py$/u,
];
const leaked = paths.filter((path) => forbidden.some((pattern) => pattern.test(path)));

if (leaked.length > 0) {
  throw new Error(`Forbidden package files detected: ${leaked.join(", ")}`);
}

const required = [
  "LICENSE",
  "NOTICE",
  "README.md",
  "README.en.md",
  "README.zh-CN.md",
  "docs/assets/column-lineage.png",
  "dist/define.d.ts",
  "dist/define.js",
  "dist/index.d.ts",
  "dist/lineage-viewer.js",
  "package.json",
];
const missing = required.filter((path) => !paths.includes(path));

if (missing.length > 0) {
  throw new Error(`Required package files are missing: ${missing.join(", ")}`);
}

process.stdout.write(`Validated ${paths.length} package files.\n`);
