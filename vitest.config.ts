import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "lineage-viewer/define": resolve(import.meta.dirname, "src/define.ts"),
      "lineage-viewer": resolve(import.meta.dirname, "src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.test.ts",
      "packages/*/tests/**/*.test.ts",
      "packages/*/tests/**/*.test.tsx",
    ],
  },
});
