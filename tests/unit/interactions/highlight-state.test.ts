import { describe, expect, it } from "vitest";
import { normalizeLineageGraphData } from "../../../src/graph/index.js";
import { calculateInteractionState } from "../../../src/interactions/index.js";

const graph = normalizeLineageGraphData({
  schemaVersion: "1.0",
  nodes: ["a", "b", "c", "d"].map((id) => ({ id, label: id })),
  edges: [
    { source: "a", target: "b" },
    { source: "b", target: "c" },
  ],
}).graph!;
describe("highlight state", () => {
  it("marks recursive upstream paths and unrelated nodes", () => {
    const state = calculateInteractionState(graph, "c", "upstream");
    expect([...state.highlightedNodeIds]).toEqual(["a", "b"]);
    expect([...state.dimmedNodeIds]).toEqual(["d"]);
    expect(state.highlightedEdgeKeys.size).toBe(2);
  });
  it("keeps only the selection visible in none mode", () => {
    const state = calculateInteractionState(graph, "b", "none");
    expect(state.selectedNodeId).toBe("b");
    expect(state.dimmedNodeIds.size).toBe(0);
  });
});
