import type { LineageDiagnostic } from "../schema/diagnostics.js";
import type { LineageNode } from "../schema/types.js";

export interface LineageReadyEventDetail {
  nodeCount: number;
  edgeCount: number;
  state: "empty" | "rendered";
}
export interface LineageDiagnosticEventDetail {
  diagnostics: readonly LineageDiagnostic[];
  hasErrors: boolean;
}
export interface LineageNodeClickEventDetail {
  nodeId: string;
  node: LineageNode;
}
export interface LineageSelectionChangeEventDetail {
  selectedNodeId: string | null;
  previousSelectedNodeId: string | null;
  node: LineageNode | null;
  source: "pointer" | "api" | "data";
}
export interface LineageViewerEventDetailMap {
  "lineage-ready": LineageReadyEventDetail;
  "lineage-error": LineageDiagnosticEventDetail;
  "lineage-warning": LineageDiagnosticEventDetail;
  "lineage-node-click": LineageNodeClickEventDetail;
  "lineage-selection-change": LineageSelectionChangeEventDetail;
}
export type LineageViewerEventName =
  | "lineage-ready"
  | "lineage-error"
  | "lineage-warning"
  | "lineage-node-click"
  | "lineage-selection-change";
