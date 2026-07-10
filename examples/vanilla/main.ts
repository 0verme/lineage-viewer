import "../../src/define.js";

const viewer = document.querySelector("lineage-viewer");
if (viewer instanceof HTMLElement && "data" in viewer) {
  (viewer as import("../../src/index.js").LineageViewerElement).data = {
    schemaVersion: "1.0",
    nodes: [
      {
        id: "ods_order",
        label: "ODS_ORDER",
        subtitle: "Source table",
        layer: "ODS",
        type: "table",
      },
      {
        id: "dwd_order",
        label: "DWD_ORDER",
        subtitle: "Detail model",
        layer: "DWD",
        type: "table",
      },
      {
        id: "dws_trade",
        label: "DWS_TRADE",
        subtitle: "Summary model",
        layer: "DWS",
        type: "table",
      },
    ],
    edges: [
      { source: "ods_order", target: "dwd_order" },
      { source: "dwd_order", target: "dws_trade" },
    ],
  };
}
