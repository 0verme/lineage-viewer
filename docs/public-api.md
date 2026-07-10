# Public API

This document freezes the `0.1.0` public browser API. The package is currently pre-alpha and has not been published to npm; use a packed tarball or a future published version. Only the root and `./define` package exports are supported.

## Registration

The custom element is always named `<lineage-viewer>`. The root entry is side-effect free:

```ts
import { defineLineageViewer, type LineageViewerElement } from "lineage-viewer";
defineLineageViewer();
```

Alternatively, `import "lineage-viewer/define"` registers the element automatically. Both forms are safe to import or call repeatedly: registration only occurs when the tag is not already defined. Do not register a different constructor under this tag.

## Data input

Set structured data with the `data` property or `setData(data)`. This is the recommended and only public data input. There is no data attribute and JSON strings are not parsed by the element.

```ts
viewer.data = {
  schemaVersion: "1.0",
  nodes: [{ id: "orders", label: "Orders" }],
  edges: [],
};
```

`data` accepts `LineageGraphData | null`; `null` clears the graph. Assigning or calling `setData` processes the data immediately when connected and rerenders it. Object mutation after assignment is not observed, so assign again after changing an object. In `strict` mode invalid input produces no graph; in `lenient` mode recoverable issues are normalized and reported as diagnostics.

`LineageGraphData` has `nodes` and `edges` arrays, with optional `schemaVersion: "1.0"`. See [Data schema and diagnostics](data-schema.md) for the full node, edge, and validation contract.

## Properties and options

`options` is a resolved, read-only snapshot when read and accepts a partial `LineageViewerOptions` patch when set. `setOptions` has the same behavior. Unknown values and non-positive numeric dimensions are ignored. All options are properties only; no attributes are observed or synchronized.

| Property                   | Type and default                                                     | Runtime effect                                                    |
| -------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `direction`                | `"LR" \| "RL" \| "TB" \| "BT"`, `"LR"`                               | Recalculates layout.                                              |
| `fitOnLoad`                | `boolean`, `true`                                                    | Fits new scenes; enabling it fits the current scene.              |
| `readonly`                 | `boolean`, `true`                                                    | Stored option; it currently has no separate interaction behavior. |
| `showSelfLoops`            | `boolean`, `false`                                                   | Renormalizes data and updates diagnostics.                        |
| `showEdgeLabels`           | `boolean`, `false`                                                   | Rerenders edge labels.                                            |
| `validationMode`           | `"strict" \| "lenient"`, `"lenient"`                                 | Renormalizes data and updates diagnostics.                        |
| `nodeWidth` / `nodeHeight` | positive `number`, `180` / `72`                                      | Recalculates layout.                                              |
| `layerGap` / `nodeGap`     | positive `number`, `72` / `32`                                       | Recalculates layout.                                              |
| `highlightMode`            | `"connected" \| "upstream" \| "downstream" \| "none"`, `"connected"` | Updates selection highlighting.                                   |

`selectedNodeId` is a read-only `string | null`; it changes when a node is selected, cleared, removed by a data update, or the element is destroyed.

## Methods

| Method                                                     | Behavior                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `setData(data: LineageGraphData \| null): void`            | Sets input and rerenders; invalid input follows the current validation mode.             |
| `setOptions(options: Partial<LineageViewerOptions>): void` | Applies valid option fields and updates rendering as required.                           |
| `getDiagnostics(): readonly LineageDiagnostic[]`           | Returns a snapshot of latest normalization diagnostics.                                  |
| `fitView(): void`                                          | Fits the current scene when the element is active.                                       |
| `resetView(): void`                                        | Restores the scene baseline (fit or identity according to `fitOnLoad`).                  |
| `focusNode(nodeId: string): void`                          | Centers an existing, trimmed node ID without selecting it; unknown/empty IDs do nothing. |
| `selectNode(nodeId: string): void`                         | Selects an existing trimmed node ID; unknown IDs do nothing.                             |
| `clearSelection(): void`                                   | Clears selection and emits an event only when it changes.                                |
| `destroy(): void`                                          | Idempotently releases resources and permanently disables the instance.                   |

## Events

All events are `CustomEvent`s with `bubbles: true`, `composed: true`, and `cancelable: false`, so they cross the open Shadow DOM boundary. `LineageViewerEventDetailMap` and individual detail interfaces are exported for TypeScript consumers; use an event type guard when listening through the standard DOM `addEventListener` overload.

| Event                      | When                                                            | Detail                                                     |
| -------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| `lineage-ready`            | First valid empty or rendered graph is committed.               | `{ nodeCount, edgeCount, state }`                          |
| `lineage-error`            | A `setData` operation produces one or more error diagnostics.   | `{ diagnostics, hasErrors: true }`                         |
| `lineage-warning`          | A `setData` operation produces one or more warning diagnostics. | `{ diagnostics, hasErrors: false }`                        |
| `lineage-node-click`       | A rendered node is clicked, before selection updates.           | `{ nodeId, node }`                                         |
| `lineage-selection-change` | Selection changes through pointer, API, or data update.         | `{ selectedNodeId, previousSelectedNodeId, node, source }` |

## Diagnostics

Use `getDiagnostics()` after setting data. It returns the current snapshot and is replaced on each data normalization, so diagnostics update with rerenders caused by data or validation/self-loop option changes. `lineage-error` and `lineage-warning` are notifications for diagnostics emitted by `setData`; render-time UI state is not an additional diagnostic channel. Display diagnostics to users as validation feedback and keep a strict-mode error separate from a lenient-mode warning/recovery.

## Styles and layout boundary

The element has an open Shadow DOM. Host styles must give it usable space; it defaults to `display: block`, `width: 100%`, and `min-height: 320px`. Set an explicit height for a predictable viewport. Supported CSS custom properties are `--lineage-background`, `--lineage-node-background`, `--lineage-node-border`, `--lineage-node-selected-border`, `--lineage-node-selected-shadow`, `--lineage-node-text`, `--lineage-node-subtitle`, `--lineage-edge-color`, `--lineage-edge-highlight-color`, `--lineage-dimmed-opacity`, and `--lineage-font-family`.

No `::part` names are exposed. Internal Shadow DOM classes, SVG structure, and generated IDs are not compatibility guarantees.
