import { describe, expect, it } from "vitest";

import { normalizeLineageGraphData } from "../../../src/graph/normalize.js";
import { defaultLineageViewerOptions } from "../../../src/public-api/options.js";
import { createBasicRenderScene } from "../../../src/render/basic-scene.js";

const input = {
  nodes: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
    { id: "c", label: "C" },
  ],
  edges: [
    { source: "a", target: "b" },
    { source: "b", target: "c" },
  ],
};

function graph() {
  const result = normalizeLineageGraphData(input);
  if (result.graph === null) throw new Error("Expected valid graph");
  return result.graph;
}

describe("createBasicRenderScene", () => {
  it("places LR nodes in stable non-overlapping order", () => {
    const scene = createBasicRenderScene(graph(), defaultLineageViewerOptions);
    expect(scene.nodes.map((node) => node.id)).toEqual(["a", "b", "c"]);
    expect(scene.nodes.map((node) => node.x)).toEqual([32, 284, 536]);
    expect(scene.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(
      true,
    );
    expect(scene.edges.every((edge) => !edge.path.includes("NaN"))).toBe(true);
  });

  it.each(["RL", "TB", "BT"] as const)("supports provisional %s placement", (direction) => {
    const scene = createBasicRenderScene(graph(), { ...defaultLineageViewerOptions, direction });
    expect(scene.width).toBeGreaterThan(0);
    expect(scene.height).toBeGreaterThan(0);
    expect(scene.nodes).toHaveLength(3);
    expect(scene.edges).toHaveLength(2);
  });

  it("produces a valid self-loop path when loops are normalized in", () => {
    const loopGraph = normalizeLineageGraphData(
      { nodes: [{ id: "a", label: "A" }], edges: [{ source: "a", target: "a" }] },
      { showSelfLoops: true },
    ).graph;
    if (loopGraph === null) throw new Error("Expected valid graph");
    const scene = createBasicRenderScene(loopGraph, defaultLineageViewerOptions);
    expect(scene.edges[0]?.path).toMatch(/^M .* C /);
  });
});
