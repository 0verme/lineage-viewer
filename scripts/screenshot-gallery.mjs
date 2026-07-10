import { spawn } from "node:child_process";
import { resolve } from "node:path";

const child = spawn(
  process.execPath,
  [resolve("node_modules/playwright/cli.js"), "test", "tests/e2e/gallery-screenshot.spec.ts"],
  {
    stdio: "inherit",
    env: { ...process.env, GALLERY_SCREENSHOT: "1" },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
