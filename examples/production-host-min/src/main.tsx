import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  getRootNeighborhoodNodeIds,
  toViewerGraph,
  type DomainLineageGraph,
} from "@lineage-viewer/domain-adapter";
import { LineageViewerCanvas } from "@lineage-viewer/react";
import "./style.css";

const domainGraph: DomainLineageGraph = {
  rootId: "fct_daily_sales",
  nodes: [
    {
      id: "raw_orders",
      kind: "dataset",
      name: "raw_orders",
      displayName: "Synthetic source orders",
      fields: [
        { id: "amount_cents", dataType: "bigint" },
        { id: "order_date", dataType: "date" },
      ],
    },
    {
      id: "fct_daily_sales",
      kind: "dataset",
      name: "fct_daily_sales",
      displayName: "Synthetic daily sales fact",
      fields: [
        { id: "sales_usd", dataType: "decimal(18,2)" },
        { id: "sales_date", dataType: "date" },
      ],
    },
  ],
  edges: [
    {
      id: "orders-to-sales",
      sourceId: "raw_orders",
      targetId: "fct_daily_sales",
      kind: "daily_aggregation",
      sourceField: "amount_cents",
      targetField: "sales_usd",
      evidence: "SUM(amount_cents) / 100",
    },
  ],
};

function App() {
  const [detail, setDetail] = useState(
    "Select a node, field, or edge to inspect host-owned details.",
  );
  const data = useMemo(
    () =>
      toViewerGraph(domainGraph, {
        nodeTypes: { dataset: "table" },
        edgeTypes: { daily_aggregation: "aggregate" },
        edgeLabel: (edge) => `host mapping: ${edge.kind}`,
      }),
    [],
  );

  return (
    <main>
      <header>
        <h1>Minimal production host</h1>
        <p>
          All lineage data is synthetic. Replace only the domain graph fetch/mapping in a real host.
        </p>
      </header>
      <section className="layout">
        <LineageViewerCanvas
          className="viewer-host"
          data={data}
          options={{ direction: "LR", fitOnLoad: false }}
          initialFit={getRootNeighborhoodNodeIds(domainGraph)}
          initialFitOptions={{ padding: 48, maxScale: 1 }}
          onNodeSelect={({ nodeId, node }) => setDetail(`Node: ${nodeId} — ${node.label}`)}
          onFieldSelect={({ nodeId, fieldId }) => setDetail(`Field: ${nodeId}.${fieldId}`)}
          onEdgeSelect={({ edge }) =>
            setDetail(
              `Edge: ${edge.source} → ${edge.target} — ${String(edge.metadata?.evidence ?? "")}`,
            )
          }
        />
        <aside aria-live="polite">
          <h2>Selection detail</h2>
          <p data-testid="selection-detail">{detail}</p>
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
