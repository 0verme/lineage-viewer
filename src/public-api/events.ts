import type { LineageDiagnostic } from "../schema/diagnostics.js";

export interface LineageReadyEventDetail {
  nodeCount: number;
  edgeCount: number;
  state: "empty" | "rendered";
}
export interface LineageDiagnosticEventDetail {
  diagnostics: readonly LineageDiagnostic[];
  hasErrors: boolean;
}
export type LineageViewerEventName = "lineage-ready" | "lineage-error" | "lineage-warning";
