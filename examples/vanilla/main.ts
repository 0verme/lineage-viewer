import "../../src/define.js";

const viewer = document.querySelector("lineage-viewer");
if (viewer instanceof HTMLElement && "data" in viewer) {
  const lineageViewer = viewer as import("../../src/index.js").LineageViewerElement;
  lineageViewer.data = {
    schemaVersion: "1.0",
    nodes: [
      {
        id: "ods_item",
        label: "ODS_ITEM",
        subtitle: "Source table",
        layer: "ODS",
        type: "table",
      },
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
      { source: "ods_item", target: "dwd_order" },
      { source: "dwd_order", target: "dws_trade" },
    ],
  };
  document
    .querySelector<HTMLButtonElement>('[data-action="fit"]')
    ?.addEventListener("click", () => lineageViewer.fitView());
  document
    .querySelector<HTMLButtonElement>('[data-action="reset"]')
    ?.addEventListener("click", () => lineageViewer.resetView());
  document
    .querySelector<HTMLButtonElement>('[data-action="focus"]')
    ?.addEventListener("click", () => lineageViewer.focusNode("dwd_order"));
  document
    .querySelector<HTMLButtonElement>('[data-action="clear"]')
    ?.addEventListener("click", () => lineageViewer.clearSelection());
  document
    .querySelector<HTMLSelectElement>('[data-action="highlight"]')
    ?.addEventListener("change", (event) => {
      const value = (event.currentTarget as HTMLSelectElement).value;
      if (
        value === "connected" ||
        value === "upstream" ||
        value === "downstream" ||
        value === "none"
      )
        lineageViewer.options = { highlightMode: value };
    });
}
