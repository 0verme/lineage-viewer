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
const endpoints = (path: string) => {
  const match = /^M ([^ ]+) ([^ ]+) C .*?, ([^ ]+) ([^ ]+)$/.exec(path);
  if (match === null) throw new Error(`Unexpected edge path: ${path}`);
  return {
    start: { x: Number(match[1]), y: Number(match[2]) },
    end: { x: Number(match[3]), y: Number(match[4]) },
  };
};

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

  it("reuses cached layout and routed paths for identical graph options", () => {
    const graph = normalizeLineageGraphData(chain).graph!;
    const options = { ...defaultLineageViewerOptions };
    const first = createLayeredRenderScene(graph, options);
    const second = createLayeredRenderScene(graph, { ...options, showEdgeLabels: true });

    expect(second).toBe(first);
    expect(createLayeredRenderScene(graph, { ...options, direction: "TB" })).not.toBe(first);
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

  it("routes column edges from their field row centers", () => {
    const result = scene({
      nodes: [
        {
          id: "source",
          label: "Source",
          fields: [{ id: "first" }, { id: "second" }],
        },
        {
          id: "target",
          label: "Target",
          fields: [{ id: "first" }, { id: "second" }],
        },
      ],
      edges: [
        {
          source: "source",
          target: "target",
          sourceField: "second",
          targetField: "first",
        },
      ],
    });
    const nodes = positions(result);
    const source = nodes.get("source")!;
    const target = nodes.get("target")!;
    const edge = endpoints(result.edges[0]!.path);

    expect(edge.start).toEqual({
      x: source.x + source.width,
      y: source.y + 48 + 28 + 14,
    });
    expect(edge.end).toEqual({
      x: target.x,
      y: target.y + 48 + 14,
    });
  });

  it("supports one field with multiple downstream and upstream connections", () => {
    const result = scene({
      nodes: [
        {
          id: "source",
          label: "Source",
          fields: [{ id: "shared" }, { id: "other" }],
        },
        {
          id: "target",
          label: "Target",
          fields: [{ id: "first" }, { id: "shared" }],
        },
      ],
      edges: [
        {
          source: "source",
          target: "target",
          sourceField: "shared",
          targetField: "first",
        },
        {
          source: "source",
          target: "target",
          sourceField: "shared",
          targetField: "shared",
        },
        {
          source: "source",
          target: "target",
          sourceField: "other",
          targetField: "shared",
        },
      ],
    });
    const sharedSourceEdges = result.edges.filter((edge) => edge.edge.sourceField === "shared");
    const sharedTargetEdges = result.edges.filter((edge) => edge.edge.targetField === "shared");

    expect(result.edges).toHaveLength(3);
    expect(sharedSourceEdges).toHaveLength(2);
    expect(sharedTargetEdges).toHaveLength(2);
    expect(
      new Set(sharedSourceEdges.map((edge) => JSON.stringify(endpoints(edge.path).start))),
    ).toHaveLength(1);
    expect(
      new Set(sharedTargetEdges.map((edge) => JSON.stringify(endpoints(edge.path).end))),
    ).toHaveLength(1);
  });

  it.each(["LR", "RL", "TB", "BT"] as const)(
    "keeps column edge paths finite in %s layout",
    (direction) => {
      const result = scene(
        {
          nodes: [
            {
              id: "source",
              label: "Source",
              fields: [{ id: "id" }],
            },
            {
              id: "target",
              label: "Target",
              fields: [{ id: "id" }],
            },
          ],
          edges: [
            {
              source: "source",
              target: "target",
              sourceField: "id",
              targetField: "id",
            },
          ],
        },
        direction,
      );
      const source = positions(result).get("source")!;
      const edge = endpoints(result.edges[0]!.path);
      const forward = direction === "LR" || direction === "TB";

      expect(result.edges[0]!.path).not.toMatch(/NaN|Infinity/);
      expect(edge.start.x).toBe(source.x + (forward ? source.width : 0));
    },
  );

  it("routes same-node column edges outside the node", () => {
    const result = scene({
      nodes: [
        {
          id: "node",
          label: "Node",
          fields: [{ id: "first" }, { id: "second" }],
        },
      ],
      edges: [
        {
          source: "node",
          target: "node",
          sourceField: "first",
          targetField: "second",
        },
      ],
    });
    const node = positions(result).get("node")!;
    const edge = result.edges[0]!;

    expect(edge.path).toMatch(/^M .* C /);
    expect(edge.labelX).toBeGreaterThan(node.x + node.width);
    expect(edge.path).not.toMatch(/NaN|Infinity/);
  });
});
