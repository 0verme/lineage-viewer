import "lineage-viewer/define";
import type { LineageReadyEventDetail, LineageViewerElement } from "lineage-viewer";
const viewer = document.querySelector("lineage-viewer");

if (!viewer) throw new Error("The lineage-viewer host is missing.");

const typedViewer = viewer as LineageViewerElement;

typedViewer.addEventListener("lineage-ready", (event) => {
  if (isReadyEvent(event)) document.title = `ready:${event.detail.nodeCount}`;
});
typedViewer.data = {
  schemaVersion: "1.0",
  nodes: [{ id: "orders", label: "Orders" }],
  edges: [],
};

function isReadyEvent(event: Event): event is CustomEvent<LineageReadyEventDetail> {
  return event.type === "lineage-ready";
}
