import { describe, expect, it } from "vitest";

import { parseJson } from "../../site/src/playground-utils.js";

describe("JSON playground parser", () => {
  it("parses valid objects and arrays without changing source text", () => {
    expect(parseJson('{"nodes":[]}')).toMatchObject({ ok: true, value: { nodes: [] } });
    expect(parseJson("[1,2]")).toMatchObject({ ok: true, value: [1, 2] });
  });
  it("treats empty text as an editor-empty state", () => {
    expect(parseJson(" \n ")).toBeNull();
  });
  it("returns a safe parse failure with a 1-based location where available", () => {
    const result = parseJson('{\n  "nodes": [],\n}');
    expect(result).toMatchObject({ ok: false });
    if (result && !result.ok && result.position !== undefined) {
      expect(result.line).toBeGreaterThan(0);
      expect(result.column).toBeGreaterThan(0);
    }
  });
});
