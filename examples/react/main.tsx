import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "lineage-viewer/define";
import type { LineageViewerElement } from "lineage-viewer";
import "./style.css";

const data = {
  schemaVersion: "1.0" as const,
  nodes: [
    { id: "orders", label: "Orders", subtitle: "Source table" },
    { id: "clean-orders", label: "Clean orders", subtitle: "ETL transform" },
    { id: "daily-sales", label: "Daily sales", subtitle: "Analytics dataset" },
  ],
  edges: [
    { id: "orders-to-clean", source: "orders", target: "clean-orders", label: "clean" },
    { id: "clean-to-sales", source: "clean-orders", target: "daily-sales", label: "aggregate" },
  ],
};

function App() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const viewer = document.createElement("lineage-viewer") as LineageViewerElement;
    viewer.options = { fitOnLoad: true, direction: "LR" };
    viewer.data = data;
    host.append(viewer);

    return () => viewer.destroy();
  }, []);

  return <div ref={hostRef} className="viewer-host" />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
