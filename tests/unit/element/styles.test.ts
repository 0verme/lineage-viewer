import { describe, expect, it } from "vitest";
import { lineageViewerStyles } from "../../../src/element/styles.js";

describe("lineage viewer sizing", () => {
  it("lets the host, shadow root, and SVG inherit a container height", () => {
    expect(lineageViewerStyles).toContain(
      ":host { position:relative; display:block; width:100%; height:100%; min-width:0; min-height:0;",
    );
    expect(lineageViewerStyles).toContain(
      ".root { position:relative; width:100%; height:100%; min-width:0; min-height:0;",
    );
    expect(lineageViewerStyles).toContain(
      "svg { position:absolute; inset:0; display:block; width:100%; height:100%;",
    );
    expect(lineageViewerStyles).not.toContain("min-height:320px");
  });

  it("styles field rows without applying node surface styles to clip rectangles", () => {
    expect(lineageViewerStyles).toContain(".node > .node-surface");
    expect(lineageViewerStyles).toContain(".field-name,.field-data-type");
    expect(lineageViewerStyles).toContain(".field-separator");
    expect(lineageViewerStyles).toContain(".field-anchor");
    expect(lineageViewerStyles).toContain(".column-edge");
    expect(lineageViewerStyles).not.toContain(".node rect {");
  });
});
