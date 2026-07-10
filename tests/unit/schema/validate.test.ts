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
