# Demo Gallery

The public Gallery is a static, framework-free showcase for the real `<lineage-viewer>` Web Component. It is separate from `examples/vanilla/`, which remains the minimal integration example.

## Language

The Demo site defaults to Simplified Chinese. Use the `中文 | English` control in the upper-right corner to switch languages; the selection is saved in local storage. Direct links can explicitly select a language with `?lang=zh-CN` or `?lang=en` (for example, `demo.html?id=basic&lang=en`).

## Scenarios

The shared registry supplies `simple-pipeline`, `fan-in-join`, `fan-out-marts`, `warehouse-layers`, `cycles`, `disconnected-components`, and `large-graph`. The last scenario has 120 deterministic nodes; it is a browsing showcase, not a performance-limit claim.

## Interaction

Each stable URL has the form `demo.html?id=<demo-id>`. The detail page exposes the public fit, reset, selection, direction, highlight, edge-label and self-loop controls. It also shows safe node details, bounded in-memory event history, public diagnostics, and formatted read-only JSON with Clipboard API feedback. Unknown IDs show a static Not Found page.

## Development and deployment

Run `npm run build:site` to produce `site-dist/`, then `npm run preview:site` to inspect it. Vite uses a relative asset base so the generated multi-page site works under a custom domain and `demo.html` refreshes without an SPA fallback. `.github/workflows/cloudflare.yml` builds the site and deploys it as Cloudflare Workers Static Assets on `main` pushes and manual dispatch.

Run `npm run screenshot:gallery` only when intentionally updating `docs/assets/demo-gallery.png`.

## Standalone column lineage examples

The repository also contains three source-level examples that run through the Vite development server:

- `examples/column-basic/` for direct field mappings and recursive selection
- `examples/column-transform/` for transform metadata and expressions
- `examples/mixed-lineage/` for view switching, name search, and data-type filtering

These examples are intentionally separate from the hosted Gallery registry and use synthetic data only.

## Phase 7 boundary

The Gallery does not edit, parse, import, persist, or encode user JSON. Phase 7 can reuse the registry while keeping editor state separate from the most recently successful render, preserving the prior graph on parse errors and separating parse errors from schema diagnostics.
