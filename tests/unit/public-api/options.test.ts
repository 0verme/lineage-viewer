import { describe, expect, it } from "vitest";
import type { LineageViewMode } from "../../../src/index.js";
import { defaultLineageViewerOptions, resolveOptions } from "../../../src/public-api/options.js";

describe("view mode options", () => {
  it("defaults to mixed mode", () => {
    expect(defaultLineageViewerOptions.viewMode).toBe("mixed");
  });

  it("accepts every public mode and ignores invalid values", () => {
    const modes: LineageViewMode[] = ["table", "column", "mixed"];
    let options = defaultLineageViewerOptions;
    for (const viewMode of modes) {
      options = resolveOptions(options, { viewMode });
      expect(options.viewMode).toBe(viewMode);
    }
    expect(resolveOptions(options, { viewMode: "invalid" }).viewMode).toBe("mixed");
  });
});
