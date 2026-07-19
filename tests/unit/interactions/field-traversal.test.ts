import { describe, expect, it } from "vitest";
import { normalizeLineageGraphData } from "../../../src/graph/index.js";
import {
  calculateInteractionState,
  fieldReferenceKey,
  traverseFieldLineage,
} from "../../../src/interactions/index.js";

const graph = normalizeLineageGraphData({
  schemaVersion: "1.0",
  nodes: [
    { id: "source", label: "Source", fields: [{ id: "id" }, { id: "other" }] },
    { id: "middle", label: "Middle", fields: [{ id: "id" }] },
    { id: "branch", label: "Branch", fields: [{ id: "id" }] },
    { id: "sink", label: "Sink", fields: [{ id: "id" }] },
    { id: "unrelated", label: "Unrelated", fields: [{ id: "id" }] },
  ],
  edges: [
    { source: "source", target: "middle", sourceField: "id", targetField: "id" },
    { source: "middle", target: "sink", sourceField: "id", targetField: "id" },
    { source: "middle", target: "branch", sourceField: "id", targetField: "id" },
    { source: "branch", target: "source", sourceField: "id", targetField: "id" },
    { source: "unrelated", target: "sink" },
  ],
}).graph!;

const key = (nodeId: string, fieldId = "id") => fieldReferenceKey({ nodeId, fieldId });

describe("field lineage traversal", () => {
  it("walks complete upstream paths and terminates on cycles", () => {
    const result = traverseFieldLineage(graph, { nodeId: "sink", fieldId: "id" }, "upstream");
    expect(result.fieldKeys).toEqual(
      new Set([key("sink"), key("middle"), key("source"), key("branch")]),
    );
    expect(result.edgeKeys.size).toBe(4);
  });

  it("keeps upstream, downstream, and both directions distinct", () => {
    const start = { nodeId: "middle", fieldId: "id" };
    expect(traverseFieldLineage(graph, start, "downstream").fieldKeys).toEqual(
      new Set([key("middle"), key("sink"), key("branch"), key("source")]),
    );
    expect(traverseFieldLineage(graph, start, "upstream").fieldKeys).toEqual(
      new Set([key("middle"), key("source"), key("branch")]),
    );
    expect(traverseFieldLineage(graph, start, "both").fieldKeys).toEqual(
      new Set([key("middle"), key("source"), key("sink"), key("branch")]),
    );
  });

  it("ignores table edges and missing field references", () => {
    expect(traverseFieldLineage(graph, { nodeId: "unrelated", fieldId: "id" }, "both")).toEqual({
      fieldKeys: new Set([key("unrelated")]),
      edgeKeys: new Set(),
    });
    expect(traverseFieldLineage(graph, { nodeId: "missing", fieldId: "id" }, "both")).toEqual({
      fieldKeys: new Set(),
      edgeKeys: new Set(),
    });
  });
});

describe("field highlight state", () => {
  it("highlights the traversed fields and edges while dimming unrelated content", () => {
    const state = calculateInteractionState(graph, null, "downstream", {
      nodeId: "middle",
      fieldId: "id",
    });
    expect(state.selectedFieldKey).toBe(key("middle"));
    expect(state.highlightedFieldKeys).toEqual(
      new Set([key("sink"), key("branch"), key("source")]),
    );
    expect(state.dimmedFieldKeys).toEqual(new Set([key("source", "other"), key("unrelated")]));
    expect(state.dimmedNodeIds).toEqual(new Set(["unrelated"]));
    expect(state.highlightedEdgeKeys.size).toBe(4);
    expect(state.dimmedEdgeKeys.size).toBe(1);
  });

  it("accepts connected as a backwards-compatible alias for both", () => {
    const selected = { nodeId: "middle", fieldId: "id" };
    const connected = calculateInteractionState(graph, null, "connected", selected);
    const both = calculateInteractionState(graph, null, "both", selected);
    expect(connected.highlightedFieldKeys).toEqual(both.highlightedFieldKeys);
    expect(connected.highlightedEdgeKeys).toEqual(both.highlightedEdgeKeys);
  });
});
