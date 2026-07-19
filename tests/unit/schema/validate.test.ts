import { describe, expect, it } from "vitest";

import { normalizeLineageGraphData } from "../../../src/graph/normalize.js";
import { sortDiagnostics } from "../../../src/schema/diagnostics.js";
import { validateLineageGraphData } from "../../../src/schema/validate.js";

describe("schema validation", () => {
  it.each([
    null,
    [],
    "graph",
    { edges: [] },
    { nodes: [] },
    { nodes: {}, edges: [] },
    { nodes: [], edges: {} },
  ])("rejects an unrecoverable root: %j", (input) => {
    const result = normalizeLineageGraphData(input);
    expect(result.graph).toBeNull();
    expect(result.hasErrors).toBe(true);
    expect(result.diagnostics[0]?.code).toBe("INVALID_GRAPH_DATA");
  });

  it("accepts a minimum graph and defaults schemaVersion", () => {
    const result = normalizeLineageGraphData({ nodes: [{ id: " a ", label: " A " }], edges: [] });
    expect(result).toMatchObject({ hasErrors: false, diagnostics: [] });
    expect(result.graph).toMatchObject({ schemaVersion: "1.0", nodes: [{ id: "a", label: "A" }] });
  });

  it("rejects an unsupported schema version in both modes", () => {
    for (const validationMode of ["lenient", "strict"] as const) {
      expect(
        normalizeLineageGraphData(
          { schemaVersion: "2.0", nodes: [], edges: [] },
          { validationMode },
        ).graph,
      ).toBeNull();
    }
  });

  it("reports malformed nodes and retains valid nodes in lenient mode", () => {
    const result = normalizeLineageGraphData({
      nodes: [
        { id: "ok", label: "OK" },
        { id: "bad", label: "", type: "unknown" },
      ],
      edges: [],
    });
    expect(result.hasErrors).toBe(true);
    expect(result.graph?.nodes.map((node) => node.id)).toEqual(["ok"]);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain("INVALID_GRAPH_DATA");
  });

  it("recognizes the frozen root shape without normalizing it", () => {
    expect(validateLineageGraphData({ schemaVersion: "1.0", nodes: [], edges: [] })).toEqual([]);
  });

  it("normalizes column lineage fields and transform metadata", () => {
    const result = normalizeLineageGraphData({
      schemaVersion: "1.0",
      nodes: [
        {
          id: "source",
          label: "Source",
          fields: [
            {
              id: " source_id ",
              label: "Source ID",
              dataType: "bigint",
              description: "Primary key",
            },
          ],
        },
        {
          id: "target",
          label: "Target",
          fields: [{ id: "target_id", dataType: "bigint" }],
        },
      ],
      edges: [
        {
          id: "field-edge",
          source: "source",
          target: "target",
          sourceField: " source_id ",
          targetField: " target_id ",
          transformType: "rename",
          expression: "source_id AS target_id",
        },
      ],
    });

    expect(result).toMatchObject({ hasErrors: false, diagnostics: [] });
    expect(result.graph?.nodes[0]?.fields).toEqual([
      {
        id: "source_id",
        label: "Source ID",
        dataType: "bigint",
        description: "Primary key",
      },
    ]);
    expect(result.graph?.edges).toMatchObject([
      {
        sourceField: "source_id",
        targetField: "target_id",
        transformType: "rename",
        expression: "source_id AS target_id",
      },
    ]);
  });

  it("retains valid fields in input order and reports duplicate or malformed fields", () => {
    const data = {
      nodes: [
        {
          id: "table",
          label: "Table",
          fields: [
            { id: "second" },
            { id: " first ", label: "First" },
            { id: "first", dataType: "text" },
            { id: "", label: "Invalid" },
          ],
        },
      ],
      edges: [],
    };

    const lenient = normalizeLineageGraphData(data);
    expect(lenient.graph?.nodes[0]?.fields).toEqual([
      { id: "second" },
      { id: "first", label: "First" },
    ]);
    expect(lenient.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "DUPLICATE_FIELD_ID",
      "INVALID_GRAPH_DATA",
    ]);
    expect(normalizeLineageGraphData(data, { validationMode: "strict" }).graph).toBeNull();
  });

  it("rejects invalid field containers and transform values without dropping valid nodes", () => {
    const result = normalizeLineageGraphData({
      nodes: [
        { id: "a", label: "A", fields: "not-an-array" },
        { id: "b", label: "B" },
      ],
      edges: [{ id: "bad", source: "a", target: "b", transformType: "copy" }],
    });

    expect(result.graph?.nodes.map((node) => node.id)).toEqual(["a", "b"]);
    expect(result.graph?.nodes[0]?.fields).toBeUndefined();
    expect(result.graph?.edges).toEqual([]);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "INVALID_GRAPH_DATA",
      "INVALID_GRAPH_DATA",
    ]);
  });

  it("orders diagnostics by level, code, identifiers, and message", () => {
    expect(
      sortDiagnostics([
        { level: "warning", code: "CYCLE_DETECTED", message: "z", nodeId: "b" },
        { level: "error", code: "MISSING_EDGE_TARGET", message: "z" },
        { level: "error", code: "MISSING_EDGE_SOURCE", message: "z" },
        { level: "warning", code: "CYCLE_DETECTED", message: "a", nodeId: "a" },
      ]),
    ).toMatchObject([
      { code: "MISSING_EDGE_SOURCE" },
      { code: "MISSING_EDGE_TARGET" },
      { code: "CYCLE_DETECTED", nodeId: "a" },
      { code: "CYCLE_DETECTED", nodeId: "b" },
    ]);
  });
});
