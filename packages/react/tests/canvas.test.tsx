// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LineageViewerCanvas, type LineageViewerCanvasHandle } from "../src/index.js";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const graph = {
  schemaVersion: "1.0" as const,
  nodes: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
  edges: [{ id: "edge", source: "a", target: "b" }],
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("LineageViewerCanvas", () => {
  it("owns the element lifecycle and forwards imperative controls", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const ref = { current: null as LineageViewerCanvasHandle | null };

    act(() => {
      root.render(
        <LineageViewerCanvas
          ref={ref}
          data={graph}
          initialFit={["a", "b"]}
          initialFitOptions={{ padding: 32 }}
          aria-label="Lineage"
        />,
      );
    });

    const viewer = ref.current?.getElement();
    expect(viewer).not.toBeNull();
    expect(container.querySelector("lineage-viewer")).toBe(viewer);
    const fitView = vi.spyOn(viewer!, "fitView");
    ref.current?.fitView();
    expect(fitView).toHaveBeenCalledOnce();

    act(() => root.unmount());
    expect(viewer?.shadowRoot?.childElementCount).toBe(0);
  });

  it("forwards node, field, and edge event details without remounting", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const onNodeSelect = vi.fn();
    const onFieldSelect = vi.fn();
    const onEdgeSelect = vi.fn();

    act(() => {
      root.render(
        <LineageViewerCanvas
          data={graph}
          initialFit="none"
          onNodeSelect={onNodeSelect}
          onFieldSelect={onFieldSelect}
          onEdgeSelect={onEdgeSelect}
        />,
      );
    });
    const viewer = container.querySelector("lineage-viewer")!;
    viewer.dispatchEvent(
      new CustomEvent("lineage-node-click", { detail: { nodeId: "a", node: graph.nodes[0] } }),
    );
    viewer.dispatchEvent(
      new CustomEvent("lineage-field-click", { detail: { nodeId: "a", fieldId: "id" } }),
    );
    viewer.dispatchEvent(
      new CustomEvent("lineage-edge-click", {
        detail: { edgeKey: "edge", edge: graph.edges[0] },
      }),
    );

    expect(onNodeSelect).toHaveBeenCalledWith(expect.objectContaining({ nodeId: "a" }));
    expect(onFieldSelect).toHaveBeenCalledWith(expect.objectContaining({ fieldId: "id" }));
    expect(onEdgeSelect).toHaveBeenCalledWith(expect.objectContaining({ edgeKey: "edge" }));
    act(() => root.unmount());
  });
});
