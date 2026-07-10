# lineage-viewer

A lightweight, framework-agnostic, embeddable lineage graph viewer.

## Status

This project is in early development. The repository currently provides only the TypeScript build, test, formatting, linting, packaging, and continuous-integration baseline. Graph rendering and the public viewer API are not implemented yet.

## Planned capabilities

- A native Web Component backed by SVG and Shadow DOM
- A versioned, general-purpose lineage JSON schema
- Deterministic graph layout and keyboard-accessible interaction
- Theme customization through CSS custom properties
- Secure iframe embedding
- Browser-side SVG and PNG export
- Optional adapters for legacy JSON formats

These items describe the roadmap, not the current release.

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
