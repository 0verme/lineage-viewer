# Public API and events

This is the pre-alpha design contract. The Phase 3 API below is implemented; future breaking changes must be recorded in the changelog with migration guidance.

```ts
interface LineageViewerOptions {
  direction?: "LR" | "RL" | "TB" | "BT";
  fitOnLoad?: boolean;
  readonly?: boolean;
  showSelfLoops?: boolean;
  showEdgeLabels?: boolean;
  validationMode?: "strict" | "lenient";
  nodeWidth?: number;
  nodeHeight?: number;
  layerGap?: number;
  nodeGap?: number;
  highlightMode?: "connected" | "upstream" | "downstream" | "none";
}
```

## Implemented now

```ts
import { LineageViewerElement, defineLineageViewer } from "lineage-viewer";
import "lineage-viewer/define"; // registers the fixed `lineage-viewer` tag
```

The package root is side-effect free. `defineLineageViewer()` safely registers the fixed tag and is idempotent. The `./define` entry automatically performs the same safe registration.

## Properties

- `viewer.data`
- `viewer.options`
- `viewer.selectedNodeId` is read-only and currently always `null`; selection is planned.

## Methods

```ts
setData(data);
setOptions(options);
getDiagnostics();
destroy();
```

`data` is normalized using the Phase 2 runtime validator. `null` clears the current data. `options` is a patch over resolved defaults; invalid numeric dimensions are ignored. Changing `validationMode` or `showSelfLoops` re-normalizes current data. The renderer supports provisional linear `LR`, `RL`, `TB`, and `BT` placement, but this is not deterministic layered layout.

`getDiagnostics()` returns a snapshot. `destroy()` is idempotent and permanently disables the instance. Complex objects are passed through JavaScript properties or methods, not large JSON HTML attributes.

## Events

Implemented events are `lineage-ready`, `lineage-error`, and `lineage-warning`. Error and warning events aggregate diagnostics of their respective level for each `setData()` call. `lineage-ready` fires once after the first valid graph (including an empty graph) is committed.

Every event is a `CustomEvent` with data in `event.detail`, `bubbles: true`, and `composed: true`. Its detail must be serializable and must not expose internal DOM or SVG elements.

## Planned in later phases

`fitView`, `resetView`, `focusNode`, `selectNode`, `clearSelection`, `lineage-node-click`, and `lineage-selection-change` are not yet callable or dispatched. Viewport behavior, node selection, and visual upstream/downstream highlighting remain Phase 4+ work.
