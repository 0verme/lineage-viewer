import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        define: resolve(import.meta.dirname, "src/define.ts"),
      },
      formats: ["es"],
      fileName: (_format, entryName) =>
        entryName === "index" ? "lineage-viewer.js" : `${entryName}.js`,
    },
    emptyOutDir: false,
    sourcemap: true,
  },
});
