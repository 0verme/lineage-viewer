import { describe, expect, it } from "vitest";

import { detectCycleGroups } from "../../../src/graph/cycle-detection.js";
import { normalizeLineageGraphData } from "../../../src/graph/normalize.js";
import {
  getConnectedNodeIds,
  getDownstreamNodeIds,
  getUpstreamNodeIds,
} from "../../../src/graph/traversal.js";

function graph(data: unknown, showSelfLoops = false) {
  const result = normalizeLineageGraphData(data, { showSelfLoops });
  if (result.graph === null) throw new Error("Expected a normalized graph.");
  return result.graph;
}

describe("graph algorithms", () => {
  it("creates stable adjacency entries for chains and isolated nodes", () => {
    const normalized = graph({
      nodes: [
        { id: "c", label: "C" },
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "isolated", label: "I" },
      ],
      edges: [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
      ],
    });
    expect(normalized.outgoingByNodeId.get("a")?.map((edge) => edge.target)).toEqual(["b"]);
    expect(normalized.incomingByNodeId.get("c")?.map((edge) => edge.source)).toEqual(["b"]);
    expect(normalized.incomingByNodeId.get("isolated")).toEqual([]);
  });

  it("traverses upstream, downstream, and connected node ids without the start", () => {
    const normalized = graph({
      nodes: ["a", "b", "c", "d"].map((id) => ({ id, label: id })),
      edges: [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "d", target: "b" },
      ],
    });
    expect(getUpstreamNodeIds(normalized, "c")).toEqual(["a", "b", "d"]);
    expect(getDownstreamNodeIds(normalized, "a")).toEqual(["b", "c"]);
    expect(getConnectedNodeIds(normalized, "b")).toEqual(["a", "c", "d"]);
    expect(getConnectedNodeIds(normalized, "missing")).toEqual([]);
  });

  it("detects stable strongly connected components without including branches", () => {
    const data = {
      nodes: ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, label: id })),
      edges: [
        { source: "a", target: "b" },
        { source: "b", target: "a" },
        { source: "b", target: "c" },
        { source: "d", target: "e" },
        { source: "e", target: "f" },
        { source: "f", target: "d" },
      ],
    };
    const normalized = graph(data);
    expect(normalized.cycleGroups).toEqual([
      ["a", "b"],
      ["d", "e", "f"],
    ]);
    expect(
      normalizeLineageGraphData(data).diagnostics.filter(
        (diagnostic) => diagnostic.code === "CYCLE_DETECTED",
      ),
    ).toHaveLength(2);
  });

  it("detects a retained self-loop and safely traverses cycles", () => {
    const normalized = graph(
      {
        nodes: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        edges: [
          { source: "a", target: "a" },
          { source: "a", target: "b" },
          { source: "b", target: "a" },
        ],
      },
      true,
    );
    expect(normalized.cycleGroups).toEqual([["a", "b"]]);
    expect(getDownstreamNodeIds(normalized, "a")).toEqual(["b"]);
  });

  it("keeps cycle detection deterministic for direct use", () => {
    const edges = graph({
      nodes: ["a", "b", "c"].map((id) => ({ id, label: id })),
      edges: [
        { source: "c", target: "a" },
        { source: "a", target: "b" },
        { source: "b", target: "a" },
      ],
    }).edges;
    expect(detectCycleGroups(["c", "b", "a"], edges)).toEqual([["a", "b"]]);
  });
});
