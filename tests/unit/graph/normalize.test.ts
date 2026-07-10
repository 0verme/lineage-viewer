import { describe, expect, it } from "vitest";

import { normalizeLineageGraphData } from "../../../src/graph/normalize.js";

describe("graph normalization", () => {
  it("uses first valid duplicate node and rejects the graph in strict mode", () => {
    const data = {
      nodes: [
        { id: "a", label: "first" },
        { id: " a ", label: "second" },
      ],
      edges: [],
    };
    const lenient = normalizeLineageGraphData(data);
    const strict = normalizeLineageGraphData(data, { validationMode: "strict" });
    expect(lenient.graph?.nodes).toMatchObject([{ id: "a", label: "first" }]);
    expect(lenient.diagnostics).toContainEqual(
      expect.objectContaining({ code: "DUPLICATE_NODE_ID", nodeId: "a" }),
    );
    expect(strict.graph).toBeNull();
  });

  it("removes invalid endpoint edges while preserving all endpoint diagnostics", () => {
    const result = normalizeLineageGraphData({
      nodes: [{ id: "a", label: "A" }],
      edges: [{ source: "missing", target: "also-missing" }],
    });
    expect(result.graph?.edges).toEqual([]);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "MISSING_EDGE_SOURCE",
      "MISSING_EDGE_TARGET",
    ]);
  });

  it("rejects recoverable edge errors only in strict mode", () => {
    const data = {
      nodes: [{ id: "a", label: "A" }],
      edges: [{ source: "a", target: "missing" }],
    };
    expect(normalizeLineageGraphData(data).graph?.nodes).toHaveLength(1);
    expect(normalizeLineageGraphData(data, { validationMode: "strict" }).graph).toBeNull();
  });

  it("deduplicates semantic edges regardless of id and metadata", () => {
    const result = normalizeLineageGraphData({
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      edges: [
        { id: "one", source: "a", target: "b", metadata: { source: 1 } },
        { id: "two", source: "a", target: "b", type: "lineage", metadata: { source: 2 } },
      ],
    });
    expect(result.graph?.edges).toHaveLength(1);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "DUPLICATE_EDGE", level: "warning" }),
    );
  });

  it("hides self loops by default and preserves them on request", () => {
    const data = { nodes: [{ id: "a", label: "A" }], edges: [{ source: "a", target: "a" }] };
    expect(normalizeLineageGraphData(data).graph?.edges).toEqual([]);
    const visible = normalizeLineageGraphData(data, { showSelfLoops: true });
    expect(visible.graph?.edges).toHaveLength(1);
    expect(visible.diagnostics.some((diagnostic) => diagnostic.code === "SELF_LOOP_HIDDEN")).toBe(
      false,
    );
  });

  it("returns an empty graph as an info-only result", () => {
    const result = normalizeLineageGraphData(
      { nodes: [], edges: [] },
      { validationMode: "strict" },
    );
    expect(result.graph).not.toBeNull();
    expect(result.hasErrors).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: "EMPTY_GRAPH", level: "info" }),
    ]);
  });

  it("does not mutate input arrays, objects, or metadata", () => {
    const input = {
      nodes: [{ id: " a ", label: " A ", metadata: { nested: { safe: true } } }],
      edges: [],
    };
    const before = structuredClone(input);
    normalizeLineageGraphData(input);
    expect(input).toEqual(before);
  });

  it("makes valid graph output independent of input ordering", () => {
    const first = {
      nodes: [
        { id: "b", label: "B" },
        { id: "a", label: "A" },
        { id: "c", label: "C" },
      ],
      edges: [
        { source: "b", target: "c" },
        { source: "a", target: "b" },
      ],
    };
    const second = { nodes: [...first.nodes].reverse(), edges: [...first.edges].reverse() };
    const normalize = (data: typeof first) => {
      const result = normalizeLineageGraphData(data);
      return {
        nodes: result.graph?.nodes,
        edges: result.graph?.edges,
        diagnostics: result.diagnostics,
        cycles: result.graph?.cycleGroups,
      };
    };
    expect(normalize(second)).toEqual(normalize(first));
  });
});
