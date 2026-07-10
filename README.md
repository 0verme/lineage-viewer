# lineage-viewer

> A lightweight, framework-agnostic, embeddable lineage graph viewer built with native Web Components and SVG.

Project status: pre-alpha / active development. Version `0.1.0` is not published to npm or deployed to Pages.

[![CI](https://github.com/0verme/lineage-viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/0verme/lineage-viewer/actions/workflows/ci.yml) npm publishing, GitHub Releases, and Pages deployment are prepared but become available only after the first release and deployment. Expected Gallery URL: [0verme.github.io/lineage-viewer](https://0verme.github.io/lineage-viewer/); expected Playground URL: [playground.html](https://0verme.github.io/lineage-viewer/playground.html). See the [release guide](docs/releasing.md) and [CHANGELOG](CHANGELOG.md).

![Interactive Demo Gallery showing the multi-layer warehouse scenario](docs/assets/demo-gallery.png)

![Local JSON Playground with a live lineage preview](docs/assets/json-playground.png)

The repository includes a local static Demo Gallery with seven synthetic scenarios. A live demo will be available only after the Pages workflow is enabled and deployed.

This repository is still pre-alpha. It validates, normalizes, and deterministically lays out lineage graph data in a native Web Component SVG preview.

## Implemented

- TypeScript, Vite, Vitest, Playwright, ESLint, Prettier, packaging, and CI baselines.
- TypeScript schema types, runtime validation, stable diagnostics, and strict/lenient normalization.
- Duplicate-node and duplicate-edge handling, self-loop and missing-endpoint handling, adjacency indexes, cycle detection, and upstream/downstream traversal.
- `<lineage-viewer>` with an open Shadow DOM, SVG nodes, edges, arrowheads, basic light styling, and empty/invalid states.
- Deterministic layered layout: SCC condensation, longest-path ranks, stable layer ordering with basic crossing reduction, disconnected block packing, and LR/RL/TB/BT routing.
- `data`, `options`, diagnostics, lifecycle cleanup, and `lineage-ready`, `lineage-error`, and `lineage-warning` events.
- Mouse-wheel anchored zoom, pointer pan, fit/reset/focus controls, ResizeObserver-aware viewport sizing, node selection, and upstream/downstream/connected highlights.
- A minimal Vanilla preview in `examples/vanilla/`.
- Demo Gallery, multi-scenario examples, interactive demo controls, a read-only JSON viewer, diagnostics/event inspection, GitHub Pages build, and a public showcase screenshot.

## Planned

- Direct integration documentation and later framework examples.

The current preview uses deterministic layered lineage placement. It has fixed node dimensions and does not measure text, avoid obstacles, insert dummy nodes for long edges, provide full orthogonal routing, or guarantee minimum crossings. Cyclic SCCs use a deterministic same-layer mini-stack.

### Future showcase entry points

**Demo Gallery** will present prebuilt, representative lineage scenarios so people can quickly understand the viewer's visual and interaction capabilities.

**JSON Playground** will accept or import lineage JSON for validation, diagnostics, and an interactive graph preview. Its primary output is an interactive lineage graph; SVG and PNG are export capabilities, not its core output. It will not provide login, cloud saving, collaboration, or project management.

## Non-goals

lineage-viewer is a viewer, not a lineage-extraction or data-governance platform. It does not parse SQL, discover lineage automatically, scan databases or schedulers, store metadata, manage access or users, provide a general graph editor, create or drag-connect nodes, or replace Apache Atlas or DataHub.

## Product contract

- [Product scope](docs/product-scope.md)
- [Data schema and diagnostics](docs/data-schema.md)
- [Public API and events](docs/public-api.md)
- [Roadmap](docs/roadmap.md)

Phase 1 through Phase 8 (package consumption and public API freeze) are completed.

## Technical principles

- TypeScript in strict mode
- Native browser APIs and ESM
- Framework agnostic and zero runtime dependencies where practical
- Separation between schema, graph processing, layout, rendering, interaction, and export
- Synthetic data in all public examples and tests
- Explicit custom-element registration rather than import-time global side effects

## Development

Node.js 22.12 or newer is required.

```sh
npm ci
npm run check
```

Useful commands:

```sh
npm run dev          # Start the Vite development server
npm run typecheck    # Check TypeScript types
npm run lint         # Run ESLint
npm run format:check # Check formatting
npm test             # Run unit tests
npm run test:e2e     # Run the browser smoke test
npm run build        # Build ESM and declarations into dist
npm run build:site   # Build the static Gallery into site-dist
npm run preview:site # Preview the built Gallery
npm run screenshot:gallery # Update the selected documentation screenshot
npm run screenshot:playground # Update the Playground screenshot
npm run pack:check   # Validate the npm package allowlist
npm run test:package # Pack and test temporary vanilla and Vite TypeScript consumers
```

## Demo Gallery and Playground

The Gallery is a separate static site: its homepage is `/`, stable demo URLs use `/demo.html?id=<demo-id>`, and `/playground.html?demo=<demo-id>` opens a local editable sample. The Playground uses a native textarea, debounced auto-render, manual Run, strict/lenient preview options, local file import, and format/minify/copy/download tools. JSON stays in the browser and is not persisted. See [Demo Gallery](docs/demo-gallery.md) and [JSON Playground](docs/json-playground.md).

Playwright requires a compatible browser installation. For a fresh environment, install Chromium with `npx playwright install chromium` before running the E2E test.

## Install and use the package

When a release is published, install it with:

```sh
npm install lineage-viewer
```

Until then, use a locally generated tarball (`npm pack`) in a consuming project. The package runs in modern browsers with Custom Elements, Shadow DOM, SVG, `ResizeObserver`, and ES modules; it is not a Node.js runtime library.

### Vanilla JavaScript

Import the auto-registration entry point, then use the standard element. Give the host a definite height in real applications.

```ts
import "lineage-viewer/define";
import type { LineageReadyEventDetail } from "lineage-viewer";

const viewer = document.querySelector("lineage-viewer");
viewer.data = { nodes: [...], edges: [...] };
```

```css
lineage-viewer {
  display: block;
  width: 100%;
  height: 600px;
}
```

The root entry exports `LineageViewerElement` and `defineLineageViewer` without registering the custom element. Reassign `data` or call `setData()` after mutating an input object; mutations to an already assigned object are not observed.

### Vite + TypeScript

```ts
import "lineage-viewer/define";
const viewer = document.querySelector("lineage-viewer");
if (!viewer) throw new Error("Missing viewer");
viewer.addEventListener("lineage-ready", (event) => {
  if (isReadyEvent(event)) console.log(event.detail.nodeCount);
});
viewer.data = { schemaVersion: "1.0", nodes: [{ id: "orders", label: "Orders" }], edges: [] };

function isReadyEvent(event: Event): event is CustomEvent<LineageReadyEventDetail> {
  return event.type === "lineage-ready";
}
```

See [Public API](docs/public-api.md) for all supported options, methods, events, diagnostics, and styling boundaries. The local Gallery runs via `npm run dev`; its stable routes are described in [Demo Gallery](docs/demo-gallery.md).

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
