import { describe, expect, it } from "vitest";

import { getRootNeighborhoodNodeIds, toViewerGraph } from "../src/index.js";

const graph = {
  rootId: "task:load",
  nodes: [
    {
      id: "table:source",
      kind: "table",
      name: "SOURCE_TABLE_WITH_A_LONG_NAME",
      displayName: "Source table",
      namespace: "ODS",
      fields: [{ id: "customer_id", dataType: "bigint" }],
      attributes: { owner: "data-team" },
    },
    {
      id: "task:load",
      kind: "task",
      name: "load.py",
      status: "warning" as const,
    },
  ],
  edges: [
    {
      id: "edge:1",
      sourceId: "table:source",
      targetId: "task:load",
      kind: "script_reads_table",
      sourceField: "customer_id",
      targetField: "input_id",
      evidence: { type: "parser" },
      confidence: 0.92,
      attributes: { revision: "current" },
    },
  ],
};

describe("domain graph adapter", () => {
  it("maps semantics while preserving labels, status, fields, and metadata", () => {
    const viewer = toViewerGraph(graph, {
      nodeTypes: { table: "table", task: "job" },
      edgeTypes: { script_reads_table: "lineage" },
      maxLabelLength: 12,
    });

    expect(viewer.nodes[0]).toMatchObject({
      type: "table",
      label: "SOURCE_TABL…",
      layer: "ODS",
      fields: [{ id: "customer_id", dataType: "bigint" }],
      metadata: {
        fullLabel: "SOURCE_TABLE_WITH_A_LONG_NAME",
        attributes: { owner: "data-team" },
      },
    });
    expect(viewer.nodes[1]).toMatchObject({ type: "job", status: "warning" });
    expect(viewer.edges[0]).toMatchObject({
      sourceField: "customer_id",
      targetField: "input_id",
      metadata: {
        evidence: { type: "parser" },
        confidence: 0.92,
        attributes: { revision: "current" },
      },
    });
  });

  it("supports resolver functions and unbounded labels", () => {
    const viewer = toViewerGraph(graph, {
      nodeTypes: (node) => (node.kind === "task" ? "job" : "dataset"),
      edgeTypes: () => "dependency",
      edgeLabel: () => undefined,
      maxLabelLength: null,
    });

    expect(viewer.nodes[0]?.label).toBe("SOURCE_TABLE_WITH_A_LONG_NAME");
    expect(viewer.edges[0]?.type).toBe("dependency");
    expect(viewer.edges[0]?.label).toBeUndefined();
  });

  it("finds direct upstream and downstream neighbors", () => {
    expect(getRootNeighborhoodNodeIds(graph).sort()).toEqual(["table:source", "task:load"]);
    expect(getRootNeighborhoodNodeIds({ edges: [] })).toEqual([]);
  });

  it("accepts empty graphs and rejects malformed input", () => {
    expect(toViewerGraph({ nodes: [], edges: [] })).toEqual({
      schemaVersion: "1.0",
      nodes: [],
      edges: [],
    });
    expect(() => toViewerGraph(null as never)).toThrow(TypeError);
    expect(() => toViewerGraph({ nodes: [], edges: [] }, { maxLabelLength: 1 })).toThrow(
      /greater than one/u,
    );
  });
});
