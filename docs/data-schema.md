# Data schema and diagnostics

This is the schema version `1.0` contract. These TypeScript declarations are implemented as the package's shared data types; no visual rendering is implemented.

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

`validationMode` defaults to `"lenient"`. Strict mode returns no normalized graph when any error is present. Lenient mode skips invalid nodes and edges where possible, returns the remaining normalized graph, and retains every diagnostic. Root-shape errors and unsupported schema versions are unrecoverable in both modes.

Duplicate node IDs are errors: the first valid occurrence wins in lenient mode. Duplicate edges are warnings and use the canonical key `source + target + normalized type + normalized label`; the first valid occurrence wins in both modes. Metadata and edge IDs do not affect this key.

Self-loops are hidden by default and emit `SELF_LOOP_HIDDEN`; `showSelfLoops: true` preserves them. Cycles are preserved and emit one `CYCLE_DETECTED` warning per stable strongly connected component. An empty normalized graph emits `EMPTY_GRAPH` at info level. Diagnostics use stable ordering by level, code, node ID, edge ID, then message. Valid input permutations produce the same normalized nodes, edges, indexes, cycle groups, and diagnostics.
