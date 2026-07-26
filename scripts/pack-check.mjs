import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error("npm_execpath is unavailable; run this script through npm.");
}

const packages = ["lineage-viewer", "@lineage-viewer/domain-adapter", "@lineage-viewer/react"];
const forbidden = [
  /^\.reference(?:\/|$)/u,
  /^tests?(?:\/|$)/u,
  /(?:^|\/)coverage(?:\/|$)/u,
  /(?:^|\/)playwright-report(?:\/|$)/u,
  /(?:^|\/)test-results(?:\/|$)/u,
  /(?:^|\/)\.env(?:\.|$)/u,
  /\.py$/u,
];
for (const packageName of packages) {
  const result = spawnSync(
    process.execPath,
    [
      npmCli,
      "pack",
      "--dry-run",
      "--json",
      ...(packageName === "lineage-viewer" ? [] : ["--workspace", packageName]),
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(result.stderr || `npm pack failed for ${packageName}.`);
  const report = JSON.parse(result.stdout)[0];
  if (!report || !Array.isArray(report.files)) {
    throw new Error(`npm pack returned an unexpected report for ${packageName}.`);
  }
  const paths = report.files.map((file) => file.path);
  const leaked = paths.filter((path) => forbidden.some((pattern) => pattern.test(path)));
  if (leaked.length > 0) {
    throw new Error(`${packageName} contains forbidden files: ${leaked.join(", ")}`);
  }
  const required =
    packageName === "lineage-viewer"
      ? [
          "LICENSE",
          "NOTICE",
          "README.md",
          "README.en.md",
          "README.zh-CN.md",
          "docs/assets/column-lineage.png",
          "docs/production-integration.md",
          "dist/define.d.ts",
          "dist/define.js",
          "dist/index.d.ts",
          "dist/lineage-viewer.js",
          "package.json",
        ]
      : ["README.md", "dist/index.d.ts", "dist/index.js", "package.json"];
  const missing = required.filter((path) => !paths.includes(path));
  if (missing.length > 0) {
    throw new Error(`${packageName} is missing required package files: ${missing.join(", ")}`);
  }
  process.stdout.write(`Validated ${packageName}: ${paths.length} package files.\n`);
}
