import type {
  LineageEdge,
  LineageGraphData,
  LineageNode,
  LineageViewerOptions,
} from "lineage-viewer";
import type { Language } from "./i18n.js";

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
  const canonicalId = id === "basic" ? "simple-pipeline" : id;
  return demos.find((demo) => demo.id === canonicalId) ?? null;
}
export function cloneGraph(graph: LineageGraphData): LineageGraphData {
  return JSON.parse(JSON.stringify(graph)) as LineageGraphData;
}

const chineseDemoText: Record<
  string,
  Pick<LineageDemoDefinition, "title" | "summary" | "description" | "tags">
> = {
  "simple-pipeline": {
    title: "基础链路",
    summary: "从 ODS 到 ADS 的最小血缘链路。",
    description: "用于查看基础分层布局的紧凑快速开始场景。",
    tags: ["快速开始", "布局"],
  },
  "fan-in-join": {
    title: "多路汇聚",
    summary: "三个上游来源汇聚为客户交易模型。",
    description: "选择汇聚模型并使用上游高亮查看依赖关系。",
    tags: ["多路汇聚", "上游"],
  },
  "fan-out-marts": {
    title: "一对多分发",
    summary: "一个客户汇总模型分发到四个业务集市。",
    description: "选择共享模型并使用下游高亮查看使用方。",
    tags: ["一对多", "下游"],
  },
  "warehouse-layers": {
    title: "多层数据仓库",
    summary: "跨 ODS、DWD、DWM/DWS、ADS 和 DWP 的中型数仓血缘图。",
    description: "真实尺寸的模拟数仓，展示适应画布、拖拽、缩放和元数据。",
    tags: ["数据仓库", "元数据", "缩放"],
  },
  cycles: {
    title: "环路与强连通分量",
    summary: "一个有效图中同时包含环、强连通分量和保留的自环。",
    description: "环形 SCC 成员使用确定性小堆栈布局，本演示会产生环路诊断。",
    tags: ["强连通分量", "诊断", "自环"],
  },
  "disconnected-components": {
    title: "非连通图",
    summary: "独立管道、孤立节点和一个小型断开的环路。",
    description: "弱连通块被独立打包，互不重叠。",
    tags: ["连通分量", "打包"],
  },
  "large-graph": {
    title: "大型确定性图",
    summary: "120 个节点及稳定生成的边，适合浏览展示规模。",
    description: "这是确定性的展示规模，不代表性能上限。",
    tags: ["120 个节点", "适应画布", "拖拽"],
  },
};
const chineseNames: Record<string, [string, string]> = {
  ods_orders: ["ODS_订单", "原始订单数据"],
  dwd_orders: ["DWD_订单明细", "标准订单明细"],
  dws_trade: ["DWS_交易汇总", "交易主题汇总"],
  ads_daily_sales: ["ADS_每日销售", "每日销售集市"],
  ods_order: ["ODS_订单", "订单来源"],
  ods_customer: ["ODS_客户", "客户来源"],
  ods_payment: ["ODS_支付", "支付来源"],
  dwd_order_detail: ["DWD_订单明细", "订单关联明细"],
  dws_customer_trade: ["DWS_客户交易", "客户交易汇总"],
  dws_customer: ["DWS_客户汇总", "客户主题汇总"],
  ads_marketing: ["ADS_营销", "营销数据集市"],
  ads_risk: ["ADS_风控", "风控数据集市"],
  ads_operation: ["ADS_运营", "运营数据集市"],
  ads_finance: ["ADS_财务", "财务数据集市"],
  raw_events: ["ODS_事件", "上游事件流"],
  model_a: ["模型_A", "环路成员 A"],
  model_b: ["模型_B", "环路成员 B"],
  model_c: ["模型_C", "强连通成员 C"],
  model_d: ["模型_D", "强连通成员 D"],
  model_e: ["模型_E", "强连通成员 E"],
  report: ["ADS_报表", "下游报表"],
};
function localizedGraph(graph: LineageGraphData): LineageGraphData {
  const copy = cloneGraph(graph);
  copy.nodes = copy.nodes.map((item) => {
    const names = chineseNames[item.id];
    if (names) return { ...item, label: names[0], subtitle: names[1] };
    if (item.id.startsWith("model_"))
      return { ...item, label: `模型_${item.id.slice(6)}`, subtitle: "确定性展示模型" };
    const layer = item.layer ?? "数据";
    return {
      ...item,
      label: `${layer}_${item.id.replace(/^(ods|dwd|dws|dwm|ads|dwp)_?/i, "")}`,
      subtitle:
        item.subtitle?.replace(
          /Orders|order|Customer|customer|Finance|finance|Product|product/g,
          "数据",
        ) ?? "数据模型",
    };
  });
  copy.edges = copy.edges.map((item) =>
    item.label === "refresh" ? { ...item, label: "刷新" } : item,
  );
  return copy;
}
export function getLocalizedDemoData(language: Language): readonly LineageDemoDefinition[] {
  if (language === "en") return demos;
  return demos.map((demo) => ({
    ...demo,
    ...chineseDemoText[demo.id]!,
    graph: localizedGraph(demo.graph),
  }));
}
