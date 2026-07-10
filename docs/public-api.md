# Public API and events

This is the pre-alpha design contract. The API is not implemented and may change before a stable release; future breaking changes must be recorded in the changelog with migration guidance.

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

## Properties

- `viewer.data`
- `viewer.options`
- `viewer.selectedNodeId`

## Methods

```ts
setData(data);
setOptions(options);

fitView();
resetView();
focusNode(nodeId);
selectNode(nodeId);
clearSelection();

getDiagnostics();
destroy();
```

Complex objects are passed through JavaScript properties or methods, not large JSON HTML attributes. The first implementation may support only `direction: "LR"`; `RL`, `TB`, and `BT` are planned.

## Events

The first event contract contains `lineage-ready`, `lineage-node-click`, `lineage-selection-change`, `lineage-error`, and `lineage-warning`.

Every event is a `CustomEvent` with data in `event.detail`, `bubbles: true`, and `composed: true`. Its detail must be serializable and must not expose internal DOM or SVG elements.
