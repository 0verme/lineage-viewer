/** The current package version. */
export const packageVersion = "0.1.0-alpha.1" as const;

export { LineageViewerElement } from "./element/index.js";
export { defineLineageViewer } from "./registration.js";
export type { SceneBounds, ViewportFitOptions, ViewportSize, ViewportTransform } from "./interactions/index.js";
export type {
  LineageDiagnosticEventDetail,
  LineageNodeClickEventDetail,
  LineageReadyEventDetail,
  LineageSelectionChangeEventDetail,
  LineageViewerEventName,
  LineageViewerEventDetailMap,
  LineageViewerOptions,
} from "./public-api/index.js";

export type {
  LineageDiagnostic,
  LineageEdge,
  LineageGraphData,
  LineageNode,
} from "./schema/index.js";
