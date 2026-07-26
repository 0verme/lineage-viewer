import { useState } from "react";
import { createRoot } from "react-dom/client";
import { toViewerGraph, type DomainLineageGraph } from "@lineage-viewer/domain-adapter";
import { LineageViewerCanvas } from "@lineage-viewer/react";

const graph: DomainLineageGraph = {
  nodes: [
    { id: "source", kind: "dataset", name: "Source" },
    { id: "target", kind: "dataset", name: "Target" },
  ],
  edges: [{ sourceId: "source", targetId: "target", kind: "copy" }],
};

function App() {
  const [detail, setDetail] = useState("waiting");
  return (
    <>
      <LineageViewerCanvas
        style={{ display: "block", height: 480 }}
        data={toViewerGraph(graph, { nodeTypes: { dataset: "table" } })}
        onNodeSelect={({ nodeId }) => setDetail(`selected:${nodeId}`)}
      />
      <output data-testid="detail">{detail}</output>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
