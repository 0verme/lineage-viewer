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
- `viewer.selectedNodeId` is read-only. It is the selected node ID or `null`.

## Methods

```ts
setData(data);
setOptions(options);
getDiagnostics();
destroy();
fitView();
resetView();
focusNode(nodeId);
selectNode(nodeId);
clearSelection();
```

`data` is normalized using the Phase 2 runtime validator. `null` clears the current data. `options` is a patch over resolved defaults; invalid numeric dimensions are ignored. Changing `validationMode` or `showSelfLoops` re-normalizes current data. `direction`, `nodeWidth`, `nodeHeight`, `layerGap`, and `nodeGap` recalculate the internal deterministic layered scene without changing the public API.

`getDiagnostics()` returns a snapshot. `destroy()` is idempotent and permanently disables the instance. Complex objects are passed through JavaScript properties or methods, not large JSON HTML attributes.

`fitView()` immediately fits the complete current scene. `resetView()` restores the viewport baseline captured when the current scene was created (fit when `fitOnLoad` is true; identity otherwise). `focusNode()` centers an existing node without selecting it. `selectNode()` selects an existing trimmed ID without focusing it; unknown IDs are no-ops. A data update retains a selected ID when it still exists and otherwise clears it.

## Events

Implemented events are `lineage-ready`, `lineage-error`, and `lineage-warning`. Error and warning events aggregate diagnostics of their respective level for each `setData()` call. `lineage-ready` fires once after the first valid graph (including an empty graph) is committed.

`lineage-node-click` has `{ nodeId, node }`. `lineage-selection-change` has `{ selectedNodeId, previousSelectedNodeId, node, source }`, where source is `pointer`, `api`, or `data`. Node click is emitted before selection change. Event details are serializable public snapshots; all events bubble and are composed.

Every event is a `CustomEvent` with data in `event.detail`, `bubbles: true`, and `composed: true`. Its detail must be serializable and must not expose internal DOM or SVG elements.

## Interaction behavior

`fitOnLoad` fits newly created scenes. `highlightMode` supports `connected`, `upstream`, `downstream`, and `none`; the latter keeps the selected node styled without dimming related content. Wheel zoom and pointer pan are internal viewport behavior and do not rerun layout.
