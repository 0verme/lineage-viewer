import type { LineageDiagnostic } from "../schema/diagnostics.js";
import type { LineageField, LineageNode } from "../schema/types.js";

export interface LineageFieldSelection {
  nodeId: string;
  fieldId: string;
}

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
export interface LineageFieldClickEventDetail extends LineageFieldSelection {
  node: LineageNode;
  field: LineageField;
}
export interface LineageSelectionChangeEventDetail {
  selectedNodeId: string | null;
  previousSelectedNodeId: string | null;
  selectedField: LineageFieldSelection | null;
  previousSelectedField: LineageFieldSelection | null;
  node: LineageNode | null;
  field: LineageField | null;
  source: "pointer" | "api" | "data";
}
export interface LineageViewerEventDetailMap {
  "lineage-ready": LineageReadyEventDetail;
  "lineage-error": LineageDiagnosticEventDetail;
  "lineage-warning": LineageDiagnosticEventDetail;
  "lineage-node-click": LineageNodeClickEventDetail;
  "lineage-field-click": LineageFieldClickEventDetail;
  "lineage-selection-change": LineageSelectionChangeEventDetail;
}
export type LineageViewerEventName =
  | "lineage-ready"
  | "lineage-error"
  | "lineage-warning"
  | "lineage-node-click"
  | "lineage-field-click"
  | "lineage-selection-change";
