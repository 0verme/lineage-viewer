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
const previews = [];

function packPackage(packageName, destination) {
  const packed = npm(
    "pack",
    "--json",
    "--pack-destination",
    destination,
    ...(packageName === "lineage-viewer" ? [] : ["--workspace", packageName]),
  );
  if (packed.status !== 0) throw new Error(packed.stderr || `npm pack failed for ${packageName}.`);
  const report = JSON.parse(packed.stdout)[0];
  if (!report?.filename) throw new Error(`npm pack returned no tarball for ${packageName}.`);
  return join(destination, report.filename);
}

try {
  run(process.execPath, [npmCli, "run", "build"], root);
  temporaryDirectory = await mkdtemp(join(tmpdir(), "lineage-viewer-package-"));
  const tarballs = {
    viewer: packPackage("lineage-viewer", temporaryDirectory),
    domainAdapter: packPackage("@lineage-viewer/domain-adapter", temporaryDirectory),
    react: packPackage("@lineage-viewer/react", temporaryDirectory),
  };

  for (const name of ["vanilla", "vite-ts"]) {
    const consumer = join(temporaryDirectory, name);
    await cp(join(root, "test-consumers", name), consumer, { recursive: true });
    run(
      process.execPath,
      [npmCli, "install", "--ignore-scripts", "--no-audit", "--no-fund", tarballs.viewer],
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

  const reactDomain = join(temporaryDirectory, "react-domain");
  await cp(join(root, "test-consumers", "react-domain"), reactDomain, { recursive: true });
  run(
    process.execPath,
    [
      npmCli,
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      tarballs.viewer,
      tarballs.domainAdapter,
      tarballs.react,
      "react@18.3.1",
      "react-dom@18.3.1",
      "vite@8.1.4",
      "typescript@6.0.3",
      "@types/react@18.3.31",
      "@types/react-dom@18.3.7",
    ],
    reactDomain,
  );
  run(
    process.execPath,
    [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"],
    reactDomain,
  );
  run(
    process.execPath,
    [join(root, "node_modules", "vite", "bin", "vite.js"), "build"],
    reactDomain,
  );

  const vanilla = join(temporaryDirectory, "vanilla");
  const preview = spawn(
    process.execPath,
    [join(root, "node_modules", "vite", "bin", "vite.js"), "--host", "127.0.0.1", "--port", "4179"],
    { cwd: vanilla, stdio: "ignore" },
  );
  previews.push(preview);
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

  const reactPreview = spawn(
    process.execPath,
    [join(root, "node_modules", "vite", "bin", "vite.js"), "--host", "127.0.0.1", "--port", "4180"],
    { cwd: reactDomain, stdio: "ignore" },
  );
  previews.push(reactPreview);
  await new Promise((resolveReady, reject) => {
    const deadline = setTimeout(
      () => reject(new Error("React domain consumer server did not start.")),
      15_000,
    );
    const poll = () => {
      fetch("http://127.0.0.1:4180/")
        .then(() => {
          clearTimeout(deadline);
          resolveReady();
        })
        .catch(() => setTimeout(poll, 100));
    };
    poll();
  });
  const reactPage = await browser.newPage();
  await reactPage.goto("http://127.0.0.1:4180/", { waitUntil: "networkidle" });
  const node = reactPage.locator("lineage-viewer .node").first();
  await node.click();
  await reactPage.waitForFunction(() =>
    globalThis.document
      .querySelector("[data-testid='detail']")
      ?.textContent?.startsWith("selected:"),
  );
  reactPreview.kill();
  await once(reactPreview, "exit");
  previews.splice(previews.indexOf(reactPreview), 1);
  await browser.close();
  process.stdout.write(
    "Verified vanilla, Vite TypeScript, and React domain consumers from packed tarballs.\n",
  );
} finally {
  for (const preview of previews) {
    if (!preview.killed) {
      preview.kill();
      await once(preview, "exit");
    }
  }
  if (temporaryDirectory)
    await rm(temporaryDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
