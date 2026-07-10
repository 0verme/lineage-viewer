# Demo Gallery

The public Gallery is a static, framework-free showcase for the real `<lineage-viewer>` Web Component. It is separate from `examples/vanilla/`, which remains the minimal integration example.

## Scenarios

The shared registry supplies `simple-pipeline`, `fan-in-join`, `fan-out-marts`, `warehouse-layers`, `cycles`, `disconnected-components`, and `large-graph`. The last scenario has 120 deterministic nodes; it is a browsing showcase, not a performance-limit claim.

## Interaction

Each stable URL has the form `demo.html?id=<demo-id>`. The detail page exposes the public fit, reset, selection, direction, highlight, edge-label and self-loop controls. It also shows safe node details, bounded in-memory event history, public diagnostics, and formatted read-only JSON with Clipboard API feedback. Unknown IDs show a static Not Found page.

## Development and deployment

Run `npm run build:site` to produce `site-dist/`, then `npm run preview:site` to inspect it. Vite uses a relative asset base so GitHub Pages repository subpaths work and `demo.html` refreshes without an SPA fallback. `.github/workflows/pages.yml` runs on `main` pushes and manual dispatch, checks types and unit tests, builds the site, uploads the artifact, and deploys it after GitHub Pages is enabled in repository settings.

Run `npm run screenshot:gallery` only when intentionally updating `docs/assets/demo-gallery.png`.

## Phase 7 boundary

The Gallery does not edit, parse, import, persist, or encode user JSON. Phase 7 can reuse the registry while keeping editor state separate from the most recently successful render, preserving the prior graph on parse errors and separating parse errors from schema diagnostics.
