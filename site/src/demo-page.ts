import { defineLineageViewer } from "lineage-viewer";
import type { LineageNode, LineageViewerElement, LineageViewerOptions } from "lineage-viewer";
import { cloneGraph, getLocalizedDemoData, type LineageDemoDefinition } from "./demo-registry.js";
import { append, element, installStyles, link, siteFooter, siteNavigation } from "./dom.js";
import { buildLocalizedUrl, getLanguage, languageSwitcher, localizeDocument, t } from "./i18n.js";
import { styles } from "./styles.js";
defineLineageViewer();
installStyles(styles);
localizeDocument("Demo");
const app = document.querySelector("#app");
if (!app) throw new Error("Demo root is missing.");
const appRoot = app;
const id = new URLSearchParams(location.search).get("id");
const demos = getLocalizedDemoData(getLanguage());
const demo =
  demos.find((item) => item.id === (id === "basic" ? "simple-pipeline" : id)) ??
  (!location.search ? demos[0] : null);
if (!demo) {
  const shell = element("main");
  shell.className = "shell not-found";
  append(
    shell,
    element("p", t("demoNotFound")),
    element("h1", t("demoNotFoundLead")),
    element("p", t("demoNotFoundHint")),
    link(buildLocalizedUrl("./"), t("backGallery"), "primary"),
    siteFooter(),
  );
  appRoot.append(shell);
} else render(demo);
function render(current: LineageDemoDefinition): void {
  document.title = `${current.title} — ${t("titleDemo")}`;
  const shell = element("div");
  shell.className = "shell";
  const header = element("header");
  append(
    header,
    link(buildLocalizedUrl("./"), t("backGallery"), "brand"),
    link(buildLocalizedUrl(`./playground.html?demo=${current.id}`), t("editJson")),
    siteNavigation(languageSwitcher()),
  );
  const heading = element("section");
  append(
    heading,
    element("span", t("interactiveDemo")),
    element("h1", current.title),
    element("p", current.description),
  );
  const viewer = document.createElement("lineage-viewer") as LineageViewerElement;
  viewer.data = cloneGraph(current.graph);
  viewer.setOptions({ fitOnLoad: true, ...current.viewerOptions });
  const controls = element("section");
  controls.className = "controls panel";
  const setOptions = (options: Partial<LineageViewerOptions>) => {
    viewer.setOptions(options);
    directionSummary.textContent = `${t("direction")}: ${viewer.options.direction}`;
    queueMicrotask(refreshDiagnostics);
  };
  const directionSummary = element("span", `${t("direction")}: LR`);
  append(
    controls,
    button(t("fitView"), () => viewer.fitView()),
    button(t("resetView"), () => viewer.resetView()),
    button(t("clearSelection"), () => viewer.clearSelection()),
    select(t("direction"), ["LR", "RL", "TB", "BT"], "LR", (v) =>
      setOptions({ direction: v as NonNullable<LineageViewerOptions["direction"]> }),
    ),
    select(
      t("viewMode"),
      ["mixed", "table", "column"],
      current.viewerOptions?.viewMode ?? "mixed",
      (v) => setOptions({ viewMode: v as NonNullable<LineageViewerOptions["viewMode"]> }),
    ),
    select(t("highlight"), ["connected", "upstream", "downstream", "none"], "connected", (v) =>
      setOptions({ highlightMode: v as NonNullable<LineageViewerOptions["highlightMode"]> }),
    ),
    checkbox(t("showEdgeLabels"), Boolean(current.viewerOptions?.showEdgeLabels), (v) =>
      setOptions({ showEdgeLabels: v }),
    ),
    checkbox(t("showSelfLoops"), Boolean(current.viewerOptions?.showSelfLoops), (v) =>
      setOptions({ showSelfLoops: v }),
    ),
  );
  const card = element("div");
  card.className = "viewer-card demo-viewer";
  card.append(viewer);
  const summary = element("div");
  summary.className = "summary";
  const selected = element("span", t("selected", { value: t("noSelectedNode") }));
  const diagnosticSummary = element("span", t("diagnostics", { count: 0 }));
  append(
    summary,
    element("span", `${current.graph.nodes.length} ${t("nodes")}`),
    element("span", `${current.graph.edges.length} ${t("edges")}`),
    directionSummary,
    selected,
    diagnosticSummary,
  );
  const nodePanel = panel(t("selectedNode"));
  const nodeContent = element("p", t("noSelectedNode"));
  nodeContent.className = "muted";
  nodePanel.append(nodeContent);
  const eventPanel = panel(t("events"));
  const events = element("div");
  eventPanel.append(
    button(t("clearEvents"), () => events.replaceChildren()),
    events,
  );
  const diagPanel = panel(t("diagnostics", { count: 0 }));
  const diagnostics = element("div");
  diagPanel.append(diagnostics);
  const side = element("aside");
  side.className = "details";
  append(side, nodePanel, eventPanel, diagPanel);
  const visual = element("div");
  append(visual, card, summary);
  const layout = element("div");
  layout.className = "demo-layout";
  append(layout, visual, side);
  const json = JSON.stringify(current.graph, null, 2);
  const jsonPanel = panel(t("readOnlyJson"));
  const notice = element("p");
  notice.className = "notice";
  jsonPanel.append(
    button(
      t("copyJson"),
      () =>
        void navigator.clipboard
          ?.writeText(json)
          .then(() => (notice.textContent = t("copied")))
          .catch(() => (notice.textContent = t("copyFailed"))),
    ),
    notice,
  );
  const pre = element("pre");
  pre.append(element("code", json));
  jsonPanel.append(pre);
  append(shell, header, heading, controls, layout, jsonPanel, siteFooter());
  appRoot.append(shell);
  const log: Array<{ name: string; detail: unknown }> = [];
  const refreshDiagnostics = () => {
    const values = viewer.getDiagnostics();
    diagnosticSummary.textContent = t("diagnostics", { count: values.length });
    diagnostics.replaceChildren();
    if (!values.length) diagnostics.append(element("p", t("noDiagnostics")));
    for (const item of values) {
      const row = element("div", `[${item.level.toUpperCase()}] ${item.code}: ${item.message}`);
      row.className = `diagnostic ${item.level}`;
      diagnostics.append(row);
    }
  };
  [
    "lineage-ready",
    "lineage-node-click",
    "lineage-selection-change",
    "lineage-error",
    "lineage-warning",
  ].forEach((name) =>
    viewer.addEventListener(name, (event) => {
      log.unshift({ name, detail: (event as CustomEvent).detail });
      log.splice(20);
      events.replaceChildren();
      if (!log.length) events.append(element("p", t("noEvents")));
      for (const value of log)
        events.append(element("div", `${value.name}: ${safeJson(value.detail)}`));
    }),
  );
  viewer.addEventListener("lineage-selection-change", (event) => {
    const node = (event as CustomEvent<{ node: LineageNode | null }>).detail.node;
    selected.textContent = t("selected", { value: node?.id ?? t("noSelectedNode") });
    renderNode(nodeContent, node);
  });
  queueMicrotask(refreshDiagnostics);
}
function button(text: string, listener: () => void): HTMLButtonElement {
  const value = element("button", text);
  value.type = "button";
  value.addEventListener("click", listener);
  return value;
}
function select(
  label: string,
  values: readonly string[],
  initial: string,
  listener: (value: string) => void,
): HTMLLabelElement {
  const result = element("label", label);
  const input = element("select");
  for (const value of values) {
    const option = element("option", value);
    option.value = value;
    option.selected = value === initial;
    input.append(option);
  }
  input.addEventListener("change", () => listener(input.value));
  result.append(input);
  return result;
}
function checkbox(
  text: string,
  checked: boolean,
  listener: (value: boolean) => void,
): HTMLLabelElement {
  const result = element("label");
  const input = element("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => listener(input.checked));
  append(result, input, text);
  return result;
}
function panel(title: string): HTMLElement {
  const value = element("section");
  value.className = "panel";
  value.append(element("h2", title));
  return value;
}
function renderNode(target: HTMLElement, node: LineageNode | null): void {
  target.replaceChildren();
  if (!node) {
    target.textContent = t("noSelectedNode");
    return;
  }
  for (const [key, value] of [
    [t("id"), node.id],
    [t("label"), node.label],
    [t("type"), node.type ?? "—"],
    [t("layer"), node.layer ?? "—"],
    [t("subtitle"), node.subtitle ?? "—"],
    [t("metadata"), JSON.stringify(node.metadata ?? {})],
  ]) {
    const row = element("div");
    row.className = "detail";
    append(row, element("strong", key), element("span", value));
    target.append(row);
  }
}
function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable detail]";
  }
}
