export interface LineageSearchFilter {
  dataType?: string;
}

export interface LineageSearchOptions extends LineageSearchFilter {
  query?: string;
}

export interface LineageTableSearchResult {
  readonly kind: "table";
  readonly nodeId: string;
}

export interface LineageFieldSearchResult {
  readonly kind: "field";
  readonly nodeId: string;
  readonly fieldId: string;
}

export type LineageSearchResult = LineageTableSearchResult | LineageFieldSearchResult;
