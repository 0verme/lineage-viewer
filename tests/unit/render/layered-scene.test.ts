import { describe, expect, it } from "vitest";
import { normalizeLineageGraphData } from "../../../src/graph/normalize.js";
import { defaultLineageViewerOptions } from "../../../src/public-api/options.js";
import { createLayeredRenderScene } from "../../../src/render/create-render-scene.js";

function scene(input: unknown, direction: "LR" | "RL" | "TB" | "BT" = "LR") {
  const graph = normalizeLineageGraphData(input, { showSelfLoops: true }).graph;
  if (graph === null) throw new Error("Expected graph");
  return createLayeredRenderScene(graph, { ...defaultLineageViewerOptions, direction });
}
const chain = {
  nodes: ["a", "b", "c"].map((id) => ({ id, label: id })),
  edges: [
    { source: "a", target: "b" },
    { source: "b", target: "c" },
  ],
};
const positions = (value: ReturnType<typeof scene>) =>
  new Map(value.nodes.map((node) => [node.id, node]));

describe("createLayeredRenderScene", () => {
  it("uses longest-path ranks for a chain and preserves finite scene data", () => {
    const result = scene(chain);
    const nodes = positions(result);
    expect(nodes.get("a")!.rank).toBeLessThan(nodes.get("b")!.rank!);
    expect(nodes.get("b")!.rank).toBeLessThan(nodes.get("c")!.rank!);
    expect(nodes.get("a")!.x).toBeLessThan(nodes.get("b")!.x);
    expect(result.edges.every((edge) => !/NaN|Infinity/.test(edge.path))).toBe(true);
    expect(
      result.edges.every((edge) => Number.isFinite(edge.labelX) && Number.isFinite(edge.labelY)),
    ).toBe(true);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it("places converging and branching nodes in shared layers", () => {
    const result = scene({
      nodes: ["a", "b", "c"].map((id) => ({ id, label: id })),
      edges: [
        { source: "a", target: "c" },
        { source: "b", target: "c" },
      ],
    });
    const nodes = positions(result);
    expect(nodes.get("a")!.rank).toBe(nodes.get("b")!.rank);
    expect(nodes.get("c")!.rank).toBe(nodes.get("a")!.rank! + 1);
  });

  it.each([
    ["LR", "x", 1],
    ["RL", "x", -1],
    ["TB", "y", 1],
    ["BT", "y", -1],
  ] as const)("maps ranks for %s", (direction, axis, sign) => {
    const nodes = positions(scene(chain, direction));
    expect((nodes.get("b")![axis] - nodes.get("a")![axis]) * sign).toBeGreaterThan(0);
  });

  it("compresses cycles for rank while stacking their members and routing their edges", () => {
    const result = scene({
      nodes: ["in", "a", "b", "out"].map((id) => ({ id, label: id })),
      edges: [
        { source: "in", target: "a" },
        { source: "a", target: "b" },
        { source: "b", target: "a" },
        { source: "b", target: "out" },
      ],
    });
    const nodes = positions(result);
    expect(nodes.get("a")!.rank).toBe(nodes.get("b")!.rank);
    expect(nodes.get("a")!.y).not.toBe(nodes.get("b")!.y);
    expect(nodes.get("in")!.rank).toBeLessThan(nodes.get("a")!.rank!);
    expect(nodes.get("out")!.rank).toBeGreaterThan(nodes.get("a")!.rank!);
    expect(result.edges.every((edge) => /^M .* C /.test(edge.path))).toBe(true);
  });

  it("packs disconnected blocks and is independent of input order", () => {
    const input = {
      nodes: ["a", "b", "x", "y"].map((id) => ({ id, label: id })),
      edges: [
        { source: "a", target: "b" },
        { source: "x", target: "y" },
      ],
    };
    const reversed = { nodes: [...input.nodes].reverse(), edges: [...input.edges].reverse() };
    const first = scene(input);
    const second = scene(reversed);
    expect(first.nodes.map(({ id, x, y, rank }) => ({ id, x, y, rank }))).toEqual(
      second.nodes.map(({ id, x, y, rank }) => ({ id, x, y, rank })),
    );
    const nodes = positions(first);
    expect(nodes.get("a")!.y).not.toBe(nodes.get("x")!.y);
  });

  it("keeps self loop paths valid", () => {
    const result = scene({
      nodes: [{ id: "a", label: "A" }],
      edges: [{ source: "a", target: "a" }],
    });
    expect(result.edges[0]?.path).toMatch(/^M .* C /);
    expect(result.edges[0]?.labelX).toBeGreaterThan(positions(result).get("a")!.x);
  });

  it("places an edge label at the routed curve midpoint", () => {
    const result = scene({
      nodes: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      edges: [{ source: "a", target: "b", label: "reads from" }],
    });
    const edge = result.edges[0]!;
    const nodes = positions(result);
    expect(edge.labelX).toBeGreaterThan(nodes.get("a")!.x + nodes.get("a")!.width);
    expect(edge.labelX).toBeLessThan(nodes.get("b")!.x);
    expect(edge.labelY).toBe(nodes.get("a")!.y + nodes.get("a")!.height / 2);
  });

  it("keeps legacy node height and expands nodes with visible fields", () => {
    const result = scene({
      nodes: [
        { id: "empty", label: "Empty fields", fields: [] },
        {
          id: "fields",
          label: "With fields",
          fields: [{ id: "first" }, { id: "second" }, { id: "third" }],
        },
        { id: "legacy", label: "Legacy" },
      ],
      edges: [],
    });
    const nodes = positions(result);

    expect(nodes.get("legacy")!.height).toBe(defaultLineageViewerOptions.nodeHeight);
    expect(nodes.get("empty")!.height).toBe(defaultLineageViewerOptions.nodeHeight);
    expect(nodes.get("fields")!.height).toBe(132);
  });

  it("uses variable node heights without overlapping nodes in a horizontal layer", () => {
    const result = scene({
      nodes: [
        {
          id: "a",
          label: "A",
          fields: [{ id: "one" }, { id: "two" }, { id: "three" }],
        },
        { id: "b", label: "B", fields: [{ id: "one" }] },
        { id: "c", label: "C" },
      ],
      edges: [
        { source: "a", target: "c" },
        { source: "b", target: "c" },
      ],
    });
    const nodes = positions(result);
    const first = nodes.get("a")!;
    const second = nodes.get("b")!;

    expect(first.rank).toBe(second.rank);
    expect(first.y + first.height + defaultLineageViewerOptions.nodeGap).toBeLessThanOrEqual(
      second.y,
    );
  });

  it("advances vertical ranks by the tallest node in each layer", () => {
    const result = scene(
      {
        nodes: [
          {
            id: "a",
            label: "A",
            fields: [{ id: "one" }, { id: "two" }, { id: "three" }],
          },
          { id: "b", label: "B" },
        ],
        edges: [{ source: "a", target: "b" }],
      },
      "TB",
    );
    const nodes = positions(result);
    const source = nodes.get("a")!;
    const target = nodes.get("b")!;

    expect(target.y).toBeGreaterThanOrEqual(
      source.y + source.height + defaultLineageViewerOptions.layerGap,
    );
  });
});
