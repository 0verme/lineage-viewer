import { describe, expect, it } from "vitest";
import { normalizeLineageGraphData } from "../../../src/graph/index.js";
import type { LineageSearchOptions, LineageSearchResult } from "../../../src/index.js";
import {
  calculateSearchState,
  normalizeSearchOptions,
  searchFields,
  searchLineageGraph,
} from "../../../src/search/index.js";
import { createLineageViewGraph } from "../../../src/view/index.js";

const graph = normalizeLineageGraphData({
  nodes: [
    {
      id: "orders",
      label: "Customer Orders",
      fields: [
        { id: "customer_id", label: "Customer ID", dataType: "BIGINT" },
        { id: "created_at", dataType: "timestamp" },
      ],
    },
    {
      id: "customers",
      label: "Customers",
      fields: [{ id: "id", dataType: "bigint" }],
    },
    {
      id: "audit",
      label: "Audit",
      fields: [{ id: "payload", dataType: "json" }],
    },
  ],
  edges: [
    {
      source: "customers",
      target: "orders",
      sourceField: "id",
      targetField: "customer_id",
    },
    { source: "orders", target: "audit" },
  ],
}).graph!;

describe("field search", () => {
  it("normalizes input and treats blank criteria as a cleared search", () => {
    expect(normalizeSearchOptions("  Customer  ")).toEqual({ query: "Customer" });
    expect(normalizeSearchOptions("", { dataType: " BIGINT " })).toEqual({
      dataType: "BIGINT",
    });
    expect(normalizeSearchOptions("   ")).toBeNull();
  });

  it("matches table and field ids or labels without case sensitivity", () => {
    expect(searchLineageGraph(graph, { query: "CUSTOMER" })).toEqual([
      { kind: "table", nodeId: "customers" },
      { kind: "table", nodeId: "orders" },
      { kind: "field", nodeId: "orders", fieldId: "customer_id" },
    ]);
  });

  it("filters data types exactly and combines the filter with a name query", () => {
    expect(searchLineageGraph(graph, { dataType: "BiGiNt" })).toEqual([
      { kind: "field", nodeId: "customers", fieldId: "id" },
      { kind: "field", nodeId: "orders", fieldId: "customer_id" },
    ]);
    expect(searchLineageGraph(graph, { query: "created", dataType: "TIMESTAMP" })).toEqual([
      { kind: "field", nodeId: "orders", fieldId: "created_at" },
    ]);
    expect(searchLineageGraph(graph, { query: "created", dataType: "bigint" })).toEqual([]);
  });

  it("searches fields by field name, table name, or data type with location labels", () => {
    expect(searchFields(graph, "customer")).toEqual([
      { nodeId: "customers", fieldId: "id", label: "id" },
      { nodeId: "orders", fieldId: "customer_id", label: "Customer ID" },
      { nodeId: "orders", fieldId: "created_at", label: "created_at" },
    ]);
    expect(searchFields(graph, "JSON")).toEqual([
      { nodeId: "audit", fieldId: "payload", label: "payload" },
    ]);
    expect(searchFields(graph, "   ")).toEqual([]);
  });

  it("exports public search types from the package root", () => {
    const options: LineageSearchOptions = { query: "id", dataType: "bigint" };
    const result: LineageSearchResult = {
      kind: "field",
      nodeId: "orders",
      fieldId: "customer_id",
    };
    expect(options.query).toBe("id");
    expect(result.kind).toBe("field");
  });
});

describe("search presentation state", () => {
  it("focuses matching fields and their tables while dimming unrelated content", () => {
    const results = searchLineageGraph(graph, { dataType: "bigint" });
    const state = calculateSearchState(
      graph,
      createLineageViewGraph(graph, "mixed"),
      results,
      true,
    );
    expect(state.matchedNodeIds).toEqual(new Set(["customers", "orders"]));
    expect(state.matchedFieldKeys.size).toBe(2);
    expect(state.dimmedNodeIds).toEqual(new Set(["audit"]));
    expect(state.dimmedFieldKeys.size).toBe(2);
    expect(state.dimmedEdgeKeys.size).toBe(1);
  });

  it("dims all visible content for an active search without results", () => {
    const state = calculateSearchState(graph, createLineageViewGraph(graph, "mixed"), [], true);
    expect(state.dimmedNodeIds.size).toBe(3);
    expect(state.dimmedFieldKeys.size).toBe(4);
    expect(state.dimmedEdgeKeys.size).toBe(2);
  });
});
