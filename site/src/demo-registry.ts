import type {
  LineageEdge,
  LineageGraphData,
  LineageNode,
  LineageViewerOptions,
} from "lineage-viewer";

export interface LineageDemoDefinition {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly graph: LineageGraphData;
  readonly viewerOptions?: Partial<LineageViewerOptions>;
  readonly featured?: boolean;
}

const node = (
  id: string,
  layer: string,
  subtitle: string,
  metadata?: Record<string, string>,
): LineageNode => ({
  id,
  label: id.toUpperCase(),
  layer,
  subtitle,
  type: "table",
  ...(metadata ? { metadata } : {}),
});
const edge = (source: string, target: string, label?: string): LineageEdge => ({
  source,
  target,
  ...(label ? { label } : {}),
});

const warehouseNodes = [
  node("ods_orders", "ODS", "Orders ingestion", { owner: "commerce" }),
  node("ods_customers", "ODS", "Customers ingestion"),
  node("ods_payments", "ODS", "Payments ingestion"),
  node("ods_products", "ODS", "Products ingestion"),
  node("dwd_order", "DWD", "Order detail model"),
  node("dwd_customer", "DWD", "Customer detail model"),
  node("dwd_payment", "DWD", "Payment detail model"),
  node("dwd_product", "DWD", "Product detail model"),
  node("dwd_refund", "DWD", "Refund detail model"),
  node("dws_customer_trade", "DWS", "Customer trade aggregate"),
  node("dws_product_sales", "DWS", "Product sales aggregate"),
  node("dws_finance", "DWS", "Finance aggregate"),
  node("dwm_order_funnel", "DWM", "Order funnel metric"),
  node("ads_growth_dashboard", "ADS", "Growth dashboard"),
  node("ads_finance_dashboard", "ADS", "Finance dashboard"),
  node("ads_customer_360", "ADS", "Customer 360"),
  node("ads_product_dashboard", "ADS", "Product dashboard"),
  node("dwp_executive_kpis", "DWP", "Executive KPI portal"),
  node("dwp_risk_monitor", "DWP", "Risk monitoring portal"),
  node("ads_refund_watch", "ADS", "Refund watchlist"),
];
const warehouseEdges = [
  edge("ods_orders", "dwd_order"),
  edge("ods_customers", "dwd_customer"),
  edge("ods_payments", "dwd_payment"),
  edge("ods_products", "dwd_product"),
  edge("ods_orders", "dwd_refund"),
  edge("dwd_order", "dws_customer_trade"),
  edge("dwd_customer", "dws_customer_trade"),
  edge("dwd_payment", "dws_customer_trade"),
  edge("dwd_order", "dws_product_sales"),
  edge("dwd_product", "dws_product_sales"),
  edge("dwd_payment", "dws_finance"),
  edge("dwd_refund", "dws_finance"),
  edge("dwd_order", "dwm_order_funnel"),
  edge("dws_customer_trade", "ads_growth_dashboard"),
  edge("dwm_order_funnel", "ads_growth_dashboard"),
  edge("dws_finance", "ads_finance_dashboard"),
  edge("dws_customer_trade", "ads_customer_360"),
  edge("dws_product_sales", "ads_product_dashboard"),
  edge("dws_customer_trade", "dwp_executive_kpis"),
  edge("dws_finance", "dwp_executive_kpis"),
  edge("dws_finance", "dwp_risk_monitor"),
  edge("dwd_refund", "ads_refund_watch"),
  edge("dws_finance", "ads_refund_watch"),
  edge("dws_product_sales", "dwp_executive_kpis"),
  edge("dwd_customer", "ads_customer_360"),
  edge("dwd_product", "ads_product_dashboard"),
  edge("dwd_order", "ads_refund_watch"),
  edge("dwm_order_funnel", "dwp_executive_kpis"),
  edge("ods_payments", "dwd_refund"),
  edge("dwd_order", "dws_finance"),
  edge("dwd_customer", "dwm_order_funnel"),
];

function largeGraph(): LineageGraphData {
  const nodes = Array.from({ length: 120 }, (_, index) =>
    node(
      `model_${String(index + 1).padStart(3, "0")}`,
      `L${Math.floor(index / 20) + 1}`,
      "Deterministic showcase model",
    ),
  );
  const first = nodes[0];
  if (!first) throw new Error("Large graph requires an initial node.");
  const edges = nodes.slice(20).map((target, index) => {
    const source = nodes[(index % 20) + Math.floor(index / 20) * 20] ?? first;
    return edge(source.id, target.id);
  });
  for (let index = 20; index < 120; index += 3) {
    const source = nodes[index - 20];
    const target = nodes[index];
    if (source && target) edges.push(edge(source.id, target.id));
  }
  return { schemaVersion: "1.0", nodes, edges };
}

export const demos: readonly LineageDemoDefinition[] = [
  {
    id: "simple-pipeline",
    title: "Simple warehouse pipeline",
    summary: "A minimal ODS to ADS lineage chain.",
    description: "A compact Quick Start scenario for inspecting the basic layered layout.",
    tags: ["quick start", "layout"],
    featured: true,
    graph: {
      schemaVersion: "1.0",
      nodes: [
        node("ods_orders", "ODS", "Raw order feed"),
        node("dwd_orders", "DWD", "Order detail"),
        node("dws_trade", "DWS", "Trade summary"),
        node("ads_daily_sales", "ADS", "Daily sales mart"),
      ],
      edges: [
        edge("ods_orders", "dwd_orders"),
        edge("dwd_orders", "dws_trade"),
        edge("dws_trade", "ads_daily_sales"),
      ],
    },
  },
  {
    id: "fan-in-join",
    title: "Multiple sources converge",
    summary: "Three upstream sources join into a customer-trade model.",
    description: "Select the join model and use upstream highlighting to inspect its dependencies.",
    tags: ["fan-in", "upstream"],
    graph: {
      schemaVersion: "1.0",
      nodes: [
        node("ods_order", "ODS", "Order source"),
        node("ods_customer", "ODS", "Customer source"),
        node("ods_payment", "ODS", "Payment source"),
        node("dwd_order_detail", "DWD", "Joined order detail"),
        node("dws_customer_trade", "DWS", "Customer trade"),
      ],
      edges: [
        edge("ods_order", "dwd_order_detail"),
        edge("ods_customer", "dwd_order_detail"),
        edge("ods_payment", "dwd_order_detail"),
        edge("dwd_order_detail", "dws_customer_trade"),
      ],
    },
  },
  {
    id: "fan-out-marts",
    title: "One model serves multiple marts",
    summary: "A customer aggregate fans out to four business marts.",
    description: "Select the shared model and use downstream highlighting to inspect consumers.",
    tags: ["fan-out", "downstream"],
    graph: {
      schemaVersion: "1.0",
      nodes: [
        node("dws_customer", "DWS", "Customer aggregate"),
        node("ads_marketing", "ADS", "Marketing mart"),
        node("ads_risk", "ADS", "Risk mart"),
        node("ads_operation", "ADS", "Operations mart"),
        node("ads_finance", "ADS", "Finance mart"),
      ],
      edges: [
        edge("dws_customer", "ads_marketing"),
        edge("dws_customer", "ads_risk"),
        edge("dws_customer", "ads_operation"),
        edge("dws_customer", "ads_finance"),
      ],
    },
  },
  {
    id: "warehouse-layers",
    title: "Multi-layer warehouse",
    summary: "A medium warehouse lineage graph across ODS, DWD, DWM/DWS, ADS and DWP.",
    description: "A realistic-sized synthetic warehouse showcasing fit, pan, zoom and metadata.",
    tags: ["warehouse", "metadata", "zoom"],
    graph: { schemaVersion: "1.0", nodes: warehouseNodes, edges: warehouseEdges },
  },
  {
    id: "cycles",
    title: "Cycles and self-reference",
    summary: "Cycles, an SCC, and a preserved self-loop in one valid graph.",
    description:
      "Cyclic SCC members use deterministic mini-stack placement. This demo intentionally emits cycle diagnostics.",
    tags: ["SCC", "diagnostics", "self-loop"],
    viewerOptions: { showSelfLoops: true },
    graph: {
      schemaVersion: "1.0",
      nodes: [
        node("raw_events", "ODS", "Upstream feed"),
        node("model_a", "DWD", "Cycle member A"),
        node("model_b", "DWD", "Cycle member B"),
        node("model_c", "DWS", "SCC member C"),
        node("model_d", "DWS", "SCC member D"),
        node("model_e", "DWS", "SCC member E"),
        node("report", "ADS", "Downstream report"),
      ],
      edges: [
        edge("raw_events", "model_a"),
        edge("model_a", "model_b"),
        edge("model_b", "model_a"),
        edge("model_b", "model_c"),
        edge("model_c", "model_d"),
        edge("model_d", "model_e"),
        edge("model_e", "model_c"),
        edge("model_e", "report"),
        edge("model_d", "model_d", "refresh"),
      ],
    },
  },
  {
    id: "disconnected-components",
    title: "Disconnected graphs",
    summary: "Independent pipelines, an isolated node, and a small disconnected cycle.",
    description: "Weakly connected blocks are packed independently without overlap.",
    tags: ["components", "packing"],
    graph: {
      schemaVersion: "1.0",
      nodes: [
        node("orders_raw", "ODS", "Orders feed"),
        node("orders_clean", "DWD", "Orders clean"),
        node("orders_mart", "ADS", "Orders mart"),
        node("finance_raw", "ODS", "Finance feed"),
        node("finance_clean", "DWD", "Finance clean"),
        node("finance_mart", "ADS", "Finance mart"),
        node("reference_calendar", "REF", "Isolated reference"),
        node("loop_left", "DWD", "Cycle A"),
        node("loop_right", "DWD", "Cycle B"),
      ],
      edges: [
        edge("orders_raw", "orders_clean"),
        edge("orders_clean", "orders_mart"),
        edge("finance_raw", "finance_clean"),
        edge("finance_clean", "finance_mart"),
        edge("loop_left", "loop_right"),
        edge("loop_right", "loop_left"),
      ],
    },
  },
  {
    id: "large-graph",
    title: "Large deterministic graph",
    summary: "120 nodes and stable generated edges for browsing at showcase scale.",
    description: "This is a deterministic showcase scale, not a performance-limit claim.",
    tags: ["120 nodes", "fit", "pan"],
    graph: largeGraph(),
  },
];

export function findDemo(id: string | null): LineageDemoDefinition | null {
  return demos.find((demo) => demo.id === id) ?? null;
}
export function cloneGraph(graph: LineageGraphData): LineageGraphData {
  return JSON.parse(JSON.stringify(graph)) as LineageGraphData;
}
