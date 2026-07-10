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

export type ValidationMode = "strict" | "lenient";

export type LineageNodeType = NonNullable<LineageNode["type"]>;
export type LineageNodeStatus = NonNullable<LineageNode["status"]>;
export type LineageEdgeType = NonNullable<LineageEdge["type"]>;
