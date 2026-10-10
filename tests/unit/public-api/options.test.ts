import { describe, expect, it } from "vitest";
import type { FlowAnimationMode, LineageViewMode } from "../../../src/index.js";
import { defaultLineageViewerOptions, resolveOptions } from "../../../src/public-api/options.js";

describe("view mode options", () => {
  it("defaults to mixed view mode and keeps flow animation off", () => {
    expect(defaultLineageViewerOptions.viewMode).toBe("mixed");
    expect(defaultLineageViewerOptions.flowAnimation).toBe("off");
  });

  it("accepts the opt-in selection animation mode and ignores invalid values", () => {
    const mode: FlowAnimationMode = "selection";
    expect(resolveOptions(defaultLineageViewerOptions, { flowAnimation: mode }).flowAnimation).toBe(
      "selection",
    );
    expect(
      resolveOptions(defaultLineageViewerOptions, { flowAnimation: "always" }).flowAnimation,
    ).toBe("off");
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
