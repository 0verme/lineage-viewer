/** The current package version. */
export const packageVersion = "0.1.0-alpha.2" as const;

export { LineageViewerElement } from "./element/index.js";
export { defineLineageViewer } from "./registration.js";
export type {
  SceneBounds,
  ViewportFitOptions,
  ViewportSize,
  ViewportTransform,
} from "./interactions/index.js";
export type {
  LineageDiagnosticEventDetail,
  LineageFieldClickEventDetail,
  LineageFieldSelection,
  LineageFieldSearchResult,
  LineageNodeClickEventDetail,
  LineageReadyEventDetail,
  LineageSelectionChangeEventDetail,
  LineageSearchFilter,
  LineageSearchOptions,
  LineageSearchResult,
  LineageTableSearchResult,
  LineageViewerEventName,
  LineageViewerEventDetailMap,
  LineageViewerOptions,
  LineageViewMode,
} from "./public-api/index.js";

export type {
  LineageDiagnostic,
  LineageEdge,
  LineageField,
  LineageGraphData,
  LineageNode,
  LineageTransformType,
} from "./schema/index.js";
