# lineage-viewer

> A lightweight, framework-agnostic, embeddable lineage graph viewer built with native Web Components and SVG.

Project status: Pre-alpha

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

## Planned

- Demo Gallery, JSON Playground, direct integration documentation, and later framework examples.

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

Phase 1 (product contract), Phase 2 (schema and graph normalization), Phase 3 (minimal Web Component and SVG renderer), Phase 4 (deterministic layered layout), and Phase 5 (viewport and interactions) are completed. Phase 6 is current / next.

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
npm run pack:check   # Validate the npm package allowlist
```

Playwright requires a compatible browser installation. For a fresh environment, install Chromium with `npx playwright install chromium` before running the E2E test.

## Minimal browser usage

Import the auto-registration entry point, then use the standard element. Give the host a definite height in real applications.

```ts
import "lineage-viewer/define";

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

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
