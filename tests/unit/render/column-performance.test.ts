import { describe, expect, it } from "vitest";
import { normalizeLineageGraphData } from "../../../src/graph/index.js";
import { traverseFieldLineage } from "../../../src/interactions/index.js";
import { defaultLineageViewerOptions } from "../../../src/public-api/options.js";
import { createLayeredRenderScene } from "../../../src/render/index.js";

describe("large column lineage", () => {
  it("normalizes, routes, and traverses 100 tables, 5000 fields, and 10000 relations", () => {
    const nodes = Array.from({ length: 100 }, (_, nodeIndex) => ({
      id: `table_${nodeIndex}`,
      label: `Table ${nodeIndex}`,
      fields: Array.from({ length: 50 }, (_, fieldIndex) => ({
        id: `field_${fieldIndex}`,
        dataType: "bigint",
      })),
    }));
    const edges = Array.from({ length: 99 }, (_, nodeIndex) =>
      Array.from({ length: 100 }, (_, relationIndex) => ({
        source: `table_${nodeIndex}`,
        target: `table_${nodeIndex + 1}`,
        sourceField: `field_${relationIndex % 50}`,
        targetField: `field_${(relationIndex + Math.floor(relationIndex / 50)) % 50}`,
      })),
    )
      .flat()
      .concat(
        Array.from({ length: 100 }, (_, relationIndex) => ({
          source: "table_0",
          target: "table_2",
          sourceField: `field_${relationIndex % 50}`,
          targetField: `field_${(relationIndex + Math.floor(relationIndex / 50)) % 50}`,
        })),
      );

    const normalized = normalizeLineageGraphData({ nodes, edges });
    expect(normalized.diagnostics).toEqual([]);
    expect(normalized.graph?.nodes).toHaveLength(100);
    expect(normalized.graph?.nodes.reduce((sum, node) => sum + (node.fields?.length ?? 0), 0)).toBe(
      5000,
    );
    expect(normalized.graph?.edges).toHaveLength(10000);

    const graph = normalized.graph!;
    const scene = createLayeredRenderScene(graph, defaultLineageViewerOptions);
    expect(scene.nodes).toHaveLength(100);
    expect(scene.edges).toHaveLength(10000);
    expect(scene.edges.every((edge) => !/NaN|Infinity/.test(edge.path))).toBe(true);

    const traversal = traverseFieldLineage(
      graph,
      { nodeId: "table_0", fieldId: "field_0" },
      "downstream",
    );
    expect(traversal.fieldKeys.size).toBeGreaterThanOrEqual(100);
    expect(traversal.edgeKeys.size).toBeGreaterThanOrEqual(198);
  });
});
