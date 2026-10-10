import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const workflows = ["ci.yml", "cloudflare.yml", "release.yml"];
const root = new URL("../", import.meta.url);

for (const filename of workflows) {
  const path = new URL(`.github/workflows/${filename}`, root);
  const prettier = new URL("node_modules/prettier/bin/prettier.cjs", root);
  const parsed = spawnSync(
    process.execPath,
    [fileURLToPath(prettier), "--parser", "yaml", "--check", fileURLToPath(path)],
    {
      encoding: "utf8",
    },
  );
  if (parsed.status !== 0)
    throw new Error(`${filename} is not valid, formatted YAML: ${parsed.stderr || parsed.stdout}`);
}

const ci = readFileSync(new URL(".github/workflows/ci.yml", root), "utf8");
const cloudflare = readFileSync(new URL(".github/workflows/cloudflare.yml", root), "utf8");
const release = readFileSync(new URL(".github/workflows/release.yml", root), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const siteConfig = readFileSync(new URL("vite.site.config.ts", root), "utf8");

function requireText(source, text, name) {
  if (!source.includes(text)) throw new Error(`${name} must contain ${JSON.stringify(text)}.`);
}

requireText(ci, "contents: read", "CI");
requireText(ci, "workflow_dispatch", "CI");
requireText(ci, "npm run test:package", "CI");
requireText(ci, "npm run test:adapter-sqlglot", "CI");
requireText(ci, "npm run lint:adapter-sqlglot", "CI");
requireText(ci, 'python -m pip install -e "packages/adapter-sqlglot[dev]"', "CI");
requireText(cloudflare, "npm run build:site", "Cloudflare workflow");
requireText(cloudflare, "CLOUDFLARE_API_TOKEN", "Cloudflare workflow");
requireText(cloudflare, "CLOUDFLARE_ACCOUNT_ID", "Cloudflare workflow");
requireText(cloudflare, "command: deploy", "Cloudflare workflow");
requireText(siteConfig, 'base: "./"', "site configuration");
requireText(release, "tags:", "release workflow");
requireText(release, '"v*"', "release workflow");
requireText(release, "id-token: write", "release workflow");
requireText(release, "environment: npm", "release workflow");
if ((release.match(/node-version: 22\.14\.0/gu) ?? []).length !== 3)
  throw new Error("Release workflow must use Node 22.14.0 for every release job.");
if ((release.match(/npm install --global npm@11\.5\.1/gu) ?? []).length !== 2)
  throw new Error("Verify and publish jobs must pin npm CLI 11.5.1.");
requireText(release, "npm run release:publish", "release workflow");
requireText(release, "--dry-run", "release workflow");
if (release.includes("npm publish --workspace"))
  throw new Error("Release workflow must publish through the resumable package coordinator.");
requireText(release, "npm run pack:check", "release workflow");
requireText(release, "github.event_name == 'push'", "release workflow");

for (const script of [
  "format:check",
  "lint",
  "typecheck",
  "test",
  "test:e2e",
  "test:e2e:site",
  "build",
  "build:site",
  "test:package",
  "test:release",
  "test:adapter-sqlglot",
  "lint:adapter-sqlglot",
  "test:workflows",
  "release:publish",
]) {
  if (!packageJson.scripts[script]) throw new Error(`Missing package script ${script}.`);
}

requireText(ci, "npm run test:e2e:site", "CI");
requireText(release, "npm run test:e2e:site", "release workflow");

for (const source of [ci, cloudflare, release]) {
  if (/([A-Za-z]:\\\\|\.reference\/|NODE_AUTH_TOKEN|npm_[A-Za-z0-9]{20,})/u.test(source)) {
    throw new Error(
      "Workflow contains a forbidden local path, reference directory, or credential-like value.",
    );
  }
}

process.stdout.write("Validated GitHub Actions workflow structure.\n");
