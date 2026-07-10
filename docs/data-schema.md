# Data schema and diagnostics

This is the frozen design contract for schema version `1.0`. These TypeScript declarations are a design draft, not shipped runtime types.

```ts
export interface LineageGraphData {
  schemaVersion?: "1.0";
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface LineageNode {
  id: string;
  label: string;
  type?: "table" | "view" | "field" | "job" | "dataset" | "custom";
  layer?: string;
  subtitle?: string;
  status?: "default" | "success" | "warning" | "error" | "muted";
  metadata?: Record<string, unknown>;
}

export interface LineageEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
  type?: "lineage" | "dependency" | "reference" | "custom";
  metadata?: Record<string, unknown>;
}

export interface LineageDiagnostic {
  level: "error" | "warning" | "info";
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export type ValidationMode = "strict" | "lenient";
```

## Rules

- `node.id` is unique across the graph; `source` and `target` must reference existing nodes.
- Node and edge array order must not affect the eventual layout.
- `label` is treated as plain text, never HTML. `metadata` does not affect default layout.
- Future schema changes use `schemaVersion`. In lenient mode, unknown extension fields may be retained.
- Version 1.0 does not introduce ports, handles, groups, node templates, or editable-connection protocols.

## Diagnostics and validation

Planned diagnostic codes are `INVALID_GRAPH_DATA`, `DUPLICATE_NODE_ID`, `DUPLICATE_EDGE`, `MISSING_EDGE_SOURCE`, `MISSING_EDGE_TARGET`, `SELF_LOOP_HIDDEN`, `CYCLE_DETECTED`, and `EMPTY_GRAPH`.

`validationMode` defaults to `"lenient"`. Strict mode rejects rendering when errors are present. Lenient mode skips invalid portions where possible, renders the remaining graph where possible, and reports diagnostics. Self-loop display will be controlled by the future `showSelfLoops` option; hidden loops emit `SELF_LOOP_HIDDEN`.
