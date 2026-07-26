# Minimal production host

This standalone Vite + React example shows the public package path:

```text
host domain graph -> toViewerGraph -> LineageViewerCanvas -> host detail panel
```

All graph names, fields, and transform evidence are synthetic. This is not a metadata backend and
does not make network requests.

## Run

Requires Node.js `>=22.13.0` and the public npm packages:

```sh
npm install
npm run dev
```

Open the local Vite URL, then select a node, field, or edge to update the detail panel. In a real
host, replace `domainGraph` with the host's subgraph fetch and keep the adapter mapping, canvas,
and event callbacks at the UI boundary.
