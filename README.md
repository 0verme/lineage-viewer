# lineage-viewer

> A lightweight, framework-agnostic, embeddable lineage graph viewer built with native Web Components and SVG.

Project status: Pre-alpha

This repository is still at an early, contract-definition stage. It is not yet a usable graph viewer.

## Implemented

- TypeScript, Vite, Vitest, Playwright, ESLint, Prettier, packaging, and CI baselines.
- Side-effect-free package entry points that currently expose only `packageVersion`.

## In progress

- Phase 1: the minimal product contract for data, public API, diagnostics, events, and roadmap.

## Planned

- Schema validation and graph normalization.
- A native Web Component and SVG renderer.
- Deterministic layered layout; the first implementation may support only `LR`.
- Viewport controls, selection, highlighting, and the documented events.
- Demo Gallery, JSON Playground, direct integration documentation, and later framework examples.

SVG rendering, deterministic layout, zoom/pan, node highlighting, export, keyboard accessibility, iframe, Streamlit, and React/Vue integration are planned capabilities, not implemented capabilities.

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

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
