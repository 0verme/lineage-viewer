import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  root: "site",
  base: "./",
  resolve: {
    alias: {
      "lineage-viewer/define": resolve(import.meta.dirname, "src/define.ts"),
      "lineage-viewer": resolve(import.meta.dirname, "src/index.ts"),
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, "site-dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "site/index.html"),
        demo: resolve(import.meta.dirname, "site/demo.html"),
      },
    },
  },
});
