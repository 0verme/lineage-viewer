import { describe, expect, it } from "vitest";
import { normalizeLineageGraphData } from "../../../src/graph/index.js";
import {
  getDirectedFlowEdges,
  isFlowWithinPathLimit,
  MAX_FLOW_PARTICLES,
  MAX_FLOW_PATHS,
} from "../../../src/render/flow-motion.js";

function normalized(edges: readonly Record<string, string>[], withFields = false) {
  const ids = ["a", "b", "c", "d", "e"];
  return normalizeLineageGraphData({
    nodes: ids.map((id) => ({
      id,
      label: id.toUpperCase(),
      ...(withFields ? { fields: [{ id: "value" }, { id: "result" }] } : {}),
    })),
    edges,
  }).graph!;
}

function routes(
  graph: NonNullable<ReturnType<typeof normalized>>,
  nodeId: string,
  mode: "connected" | "both" | "upstream" | "downstream" | "none",
) {
  return getDirectedFlowEdges(graph, nodeId, null, mode).map(({ key, direction }) => ({
    edge: graph.edges.find((item) => item.key === key)!,
    direction,
  }));
}

describe("flow animation path planning", () => {
  const graph = normalized([
    { source: "a", target: "b" },
    { source: "b", target: "c" },
    { source: "c", target: "a" },
    { source: "d", target: "b" },
  ]);

  it("walks downstream once through cycles and preserves source-to-target direction", () => {
    const result = routes(graph, "b", "downstream");
    expect(result.map(({ edge, direction }) => [edge.source, edge.target, direction])).toEqual([
      ["b", "c", "forward"],
      ["c", "a", "forward"],
      ["a", "b", "forward"],
    ]);
  });

  it("walks upstream away from the selection by reversing each edge", () => {
    const result = routes(graph, "b", "upstream");
    expect(result.map(({ edge, direction }) => [edge.source, edge.target, direction])).toEqual([
      ["a", "b", "reverse"],
      ["d", "b", "reverse"],
      ["c", "a", "reverse"],
      ["b", "c", "reverse"],
    ]);
  });

  it("treats both and connected as one cycle-safe outward walk", () => {
    const both = routes(graph, "b", "both");
    expect(routes(graph, "b", "connected")).toEqual(both);
    expect(new Set(both.map(({ edge }) => edge.key)).size).toBe(graph.edges.length);
    expect(both.find(({ edge }) => edge.source === "a")?.direction).toBe("reverse");
    expect(both.find(({ edge }) => edge.source === "b")?.direction).toBe("forward");
  });

  it("keeps field selection on field edges and follows upstream mappings backwards", () => {
    const fieldGraph = normalized(
      [
        { source: "a", target: "b", sourceField: "value", targetField: "value" },
        { source: "b", target: "c", sourceField: "value", targetField: "result" },
        { source: "a", target: "b" },
      ],
      true,
    );
    const edges = getDirectedFlowEdges(
      fieldGraph,
      null,
      { nodeId: "b", fieldId: "value" },
      "upstream",
    );
    expect(
      edges.map(({ key, direction }) => {
        const edge = fieldGraph.edges.find((item) => item.key === key)!;
        return [edge.source, edge.target, direction];
      }),
    ).toEqual([["a", "b", "reverse"]]);
    expect(
      edges.every((route) => fieldGraph.edges.find((edge) => edge.key === route.key)?.sourceField),
    ).toBe(true);
  });

  it("bounds concurrent work and falls back to static selection for oversized paths", () => {
    const longChain = Array.from({ length: MAX_FLOW_PATHS + 1 }, (_, index) => ({
      source: `n${index}`,
      target: `n${index + 1}`,
    }));
    const large = normalizeLineageGraphData({
      nodes: Array.from({ length: longChain.length + 1 }, (_, index) => ({
        id: `n${index}`,
        label: `N${index}`,
      })),
      edges: longChain,
    }).graph!;
    const edges = getDirectedFlowEdges(large, "n0", null, "downstream");
    expect(edges).toHaveLength(MAX_FLOW_PATHS + 1);
    expect(MAX_FLOW_PARTICLES).toBe(MAX_FLOW_PATHS);
    expect(isFlowWithinPathLimit(edges)).toBe(false);
    expect(isFlowWithinPathLimit(edges.slice(0, MAX_FLOW_PATHS))).toBe(true);
    expect(getDirectedFlowEdges(graph, "missing", null, "both")).toEqual([]);
    expect(getDirectedFlowEdges(graph, "b", null, "none")).toEqual([]);
  });
});
