import "lineage-viewer/define";

const viewer = globalThis.document.querySelector("lineage-viewer");

if (!viewer) throw new Error("The lineage-viewer host is missing.");

viewer.data = {
  schemaVersion: "1.0",
  nodes: [
    { id: "source", label: "Source" },
    { id: "target", label: "Target" },
  ],
  edges: [{ source: "source", target: "target" }],
};

globalThis.__lineageViewerConsumerReady =
  globalThis.customElements.get("lineage-viewer") === viewer.constructor;
