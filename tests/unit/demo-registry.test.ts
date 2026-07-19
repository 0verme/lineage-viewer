import { describe, expect, test } from "vitest";

import { normalizeLineageGraphData } from "../../src/graph/index.js";
import { cloneGraph, demos, findDemo } from "../../site/src/demo-registry.js";

describe("demo registry", () => {
  test("has stable, unique, URL-safe demo ids", () => {
    expect(demos.length).toBeGreaterThanOrEqual(10);
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
      expect(normalizeLineageGraphData(demo.graph, { showSelfLoops: true }).graph).not.toBeNull();
    }
    expect(findDemo("unknown")).toBeNull();
    expect(findDemo("basic")?.id).toBe("simple-pipeline");
    expect(findDemo("cycles")?.viewerOptions?.showSelfLoops).toBe(true);
    expect(findDemo("warehouse-layers")?.graph.nodes.length).toBeGreaterThanOrEqual(20);
    expect(findDemo("column-basic")?.viewerOptions?.viewMode).toBe("column");
    expect(findDemo("column-transform")?.graph.edges.every((edge) => edge.transformType)).toBe(
      true,
    );
    expect(demos.filter((demo) => demo.featured).map((demo) => demo.id)).toEqual([
      "simple-pipeline",
      "column-basic",
      "column-transform",
    ]);
    expect(
      findDemo("column-transform")?.graph.edges.some(
        (edge) => edge.expression === "concat(first_name, last_name)",
      ),
    ).toBe(true);
    expect(
      findDemo("mixed-lineage")?.graph.edges.some(
        (edge) => edge.sourceField === undefined && edge.targetField === undefined,
      ),
    ).toBe(true);
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
