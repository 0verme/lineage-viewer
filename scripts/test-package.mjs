import { mkdtemp, cp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const npmCli = process.env.npm_execpath;
const npm = (...args) =>
  spawnSync(process.execPath, [npmCli, ...args], { cwd: root, encoding: "utf8" });
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command} failed`);
};

if (!npmCli) throw new Error("npm_execpath is unavailable; run this script through npm.");

let temporaryDirectory;
let tarball;
let preview;
try {
  run(process.execPath, [npmCli, "run", "build"], root);
  const packed = npm("pack", "--json");
  if (packed.status !== 0) throw new Error(packed.stderr || "npm pack failed.");
  const report = JSON.parse(packed.stdout)[0];
  tarball = join(root, report.filename);
  temporaryDirectory = await mkdtemp(join(tmpdir(), "lineage-viewer-package-"));

  for (const name of ["vanilla", "vite-ts"]) {
    const consumer = join(temporaryDirectory, name);
    await cp(join(root, "test-consumers", name), consumer, { recursive: true });
    run(
      process.execPath,
      [npmCli, "install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
      consumer,
    );
    if (name === "vite-ts")
      run(
        process.execPath,
        [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"],
        consumer,
      );
    run(
      process.execPath,
      [join(root, "node_modules", "vite", "bin", "vite.js"), "build"],
      consumer,
    );
  }

  const vanilla = join(temporaryDirectory, "vanilla");
  preview = spawn(
    process.execPath,
    [join(root, "node_modules", "vite", "bin", "vite.js"), "--host", "127.0.0.1", "--port", "4179"],
    { cwd: vanilla, stdio: "ignore" },
  );
  await new Promise((resolveReady, reject) => {
    const deadline = setTimeout(
      () => reject(new Error("Vanilla consumer server did not start.")),
      15_000,
    );
    const poll = () => {
      const request = createServer();
      request.close();
      fetch("http://127.0.0.1:4179/")
        .then(() => {
          clearTimeout(deadline);
          resolveReady();
        })
        .catch(() => setTimeout(poll, 100));
    };
    poll();
  });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4179/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => globalThis.__lineageViewerConsumerReady === true);
  if (
    (await page.locator("lineage-viewer").count()) !== 1 ||
    (await page
      .locator("lineage-viewer")
      .evaluate((element) => element.shadowRoot?.querySelectorAll("svg .node").length)) !== 2
  )
    throw new Error("Vanilla consumer did not render the expected SVG nodes.");
  await browser.close();
  process.stdout.write(
    "Verified vanilla browser consumer and Vite TypeScript consumer from packed tarball.\n",
  );
} finally {
  if (preview && !preview.killed) {
    preview.kill();
    await once(preview, "exit");
  }
  if (tarball) await rm(tarball, { force: true });
  if (temporaryDirectory)
    await rm(temporaryDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
