import { describe, expect, it } from "vitest";
import { normalizeLineageGraphData } from "../../../src/graph/index.js";
import { createLineageViewGraph } from "../../../src/view/index.js";

const graph = normalizeLineageGraphData({
  nodes: [
    { id: "a", label: "A", fields: [{ id: "id" }, { id: "name" }] },
    { id: "b", label: "B", fields: [{ id: "id" }, { id: "name" }] },
    { id: "c", label: "C", fields: [{ id: "id" }] },
  ],
  edges: [
    { source: "a", target: "b", sourceField: "id", targetField: "id" },
    { source: "a", target: "b", sourceField: "name", targetField: "name" },
    { source: "a", target: "b", label: "table dependency" },
    { source: "a", target: "b", type: "reference", label: "table reference" },
    { source: "b", target: "c", sourceField: "id", targetField: "id" },
  ],
}).graph!;

describe("lineage view graph", () => {
  it("returns the complete graph for mixed mode", () => {
    expect(createLineageViewGraph(graph, "mixed")).toBe(graph);
  });

  it("keeps only column relations in column mode", () => {
    const view = createLineageViewGraph(graph, "column");
    expect(view.edges).toHaveLength(3);
    expect(
      view.edges.every((edge) => edge.sourceField !== undefined && edge.targetField !== undefined),
    ).toBe(true);
    expect(view.nodes[0]?.fields).toHaveLength(2);
    expect(view.outgoingByNodeId.get("a")).toHaveLength(2);
  });

  it("hides fields and collapses mappings by table endpoints in table mode", () => {
    const view = createLineageViewGraph(graph, "table");
    expect(view.nodes.every((node) => node.fields === undefined)).toBe(true);
    expect(view.edges).toHaveLength(3);
    expect(view.edges.every((edge) => edge.sourceField === undefined)).toBe(true);
    expect(view.edges.find((edge) => edge.source === "a")?.label).toBe("table dependency");
    expect(view.outgoingByNodeId.get("a")).toHaveLength(2);
  });

  it("derives a table relation when only column mappings exist", () => {
    const columnOnly = normalizeLineageGraphData({
      nodes: [
        { id: "a", label: "A", fields: [{ id: "first" }, { id: "second" }] },
        { id: "b", label: "B", fields: [{ id: "first" }, { id: "second" }] },
      ],
      edges: [
        { source: "a", target: "b", sourceField: "first", targetField: "first" },
        { source: "a", target: "b", sourceField: "second", targetField: "second" },
      ],
    }).graph!;
    const view = createLineageViewGraph(columnOnly, "table");
    expect(view.edges).toHaveLength(1);
    expect(view.edges[0]).toMatchObject({ source: "a", target: "b", label: "" });
  });
});
