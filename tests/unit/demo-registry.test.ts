import { describe, expect, test } from "vitest";

import { cloneGraph, demos, findDemo } from "../../site/src/demo-registry.js";

describe("demo registry", () => {
  test("has stable, unique, URL-safe demo ids", () => {
    expect(demos.length).toBeGreaterThanOrEqual(7);
    expect(new Set(demos.map((demo) => demo.id)).size).toBe(demos.length);
    expect(demos.every((demo) => /^[a-z0-9-]+$/.test(demo.id))).toBe(true);
  });
  test("has complete representative graph definitions", () => {
    for (const demo of demos) {
      expect(demo.title).not.toBe("");
      expect(demo.description).not.toBe("");
      expect(new Set(demo.graph.nodes.map((node) => node.id)).size).toBe(demo.graph.nodes.length);
      expect(
        demo.graph.edges.every(
          (edge) =>
            demo.graph.nodes.some((node) => node.id === edge.source) &&
            demo.graph.nodes.some((node) => node.id === edge.target),
        ),
      ).toBe(true);
    }
    expect(findDemo("unknown")).toBeNull();
    expect(findDemo("cycles")?.viewerOptions?.showSelfLoops).toBe(true);
    expect(findDemo("warehouse-layers")?.graph.nodes.length).toBeGreaterThanOrEqual(20);
  });
  test("creates deterministic large graphs and defensive copies", () => {
    const first = findDemo("large-graph")?.graph;
    const second = findDemo("large-graph")?.graph;
    expect(first).toEqual(second);
    expect(first?.nodes.length).toBe(120);
    expect(first?.edges.length).toBeGreaterThanOrEqual(120);
    const firstDemo = demos[0];
    const copy = cloneGraph(firstDemo!.graph);
    copy.nodes[0]!.label = "changed";
    expect(firstDemo!.graph.nodes[0]!.label).not.toBe("changed");
  });
});
