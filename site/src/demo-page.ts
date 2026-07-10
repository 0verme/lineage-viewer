import "lineage-viewer/define";
import type {
  LineageDiagnostic,
  LineageNode,
  LineageViewerElement,
  LineageViewerOptions,
} from "lineage-viewer";

import { cloneGraph, demos, findDemo } from "./demo-registry.js";
import { append, element, installStyles, link } from "./dom.js";
import { styles } from "./styles.js";

installStyles(styles);
const app = document.querySelector("#app");
if (!app) throw new Error("Demo root is missing.");
const appRoot = app;
type Direction = NonNullable<LineageViewerOptions["direction"]>;
type HighlightMode = NonNullable<LineageViewerOptions["highlightMode"]>;
const demo =
  findDemo(new URLSearchParams(location.search).get("id")) ?? (location.search ? null : demos[0]);
if (!demo) {
  const shell = element("main");
  shell.className = "shell not-found";
  append(
    shell,
    element("p", "Demo not found"),
    element("h1", "That demo is not in the gallery."),
    element("p", "Choose one of the registered, stable demo URLs instead."),
    link("./", "Back to gallery", "primary"),
  );
  appRoot.append(shell);
} else renderDemo(demo);

function renderDemo(current: NonNullable<typeof demo>): void {
  document.title = `${current.title} — lineage-viewer demo`;
  const shell = element("div");
  shell.className = "shell";
  const header = element("header");
  append(
    header,
    link("./", "← Back to gallery", "brand"),
    link(
      `./playground.html?demo=${encodeURIComponent(current.id)}`,
      "Edit this JSON in Playground",
    ),
    element("span", current.title),
  );
  const heading = element("section");
  append(
    heading,
    element("span", "Interactive demo"),
    element("h1", current.title),
    element("p", current.description),
  );
  const controls = element("section");
  controls.className = "controls panel";
  const viewer = document.createElement("lineage-viewer") as LineageViewerElement;
  viewer.data = cloneGraph(current.graph);
  viewer.setOptions({ fitOnLoad: true, ...current.viewerOptions });
  const fit = button("Fit view", () => viewer.fitView());
  const reset = button("Reset view", () => viewer.resetView());
  const clear = button("Clear selection", () => viewer.clearSelection());
  const direction = select("Direction", ["LR", "RL", "TB", "BT"], "LR", (value) =>
    setOptions({ direction: value as Direction }),
  );
  const highlight = select(
    "Highlight",
    ["connected", "upstream", "downstream", "none"],
    "connected",
    (value) => setOptions({ highlightMode: value as HighlightMode }),
  );
  const edgeLabels = checkbox("Show edge labels", false, (checked) =>
    setOptions({ showEdgeLabels: checked }),
  );
  const selfLoops = checkbox(
    "Show self-loops",
    Boolean(current.viewerOptions?.showSelfLoops),
    (checked) => setOptions({ showSelfLoops: checked }),
  );
  append(controls, fit, reset, clear, direction, highlight, edgeLabels, selfLoops);
  const viewerCard = element("div");
  viewerCard.className = "viewer-card demo-viewer";
  viewerCard.append(viewer);
  const summary = element("div");
  summary.className = "summary";
  const selectedSummary = element("span", "Selected: none");
  const diagnosticSummary = element("span", "Diagnostics: 0");
  append(
    summary,
    element("span", `Nodes: ${current.graph.nodes.length}`),
    element("span", `Edges: ${current.graph.edges.length}`),
    element("span", "Direction: LR"),
    selectedSummary,
    diagnosticSummary,
  );
  const nodePanel = panel("Selected node");
  const nodeContent = element("p", "No node selected.");
  nodeContent.className = "muted";
  nodePanel.append(nodeContent);
  const eventPanel = panel("Recent events");
  const clearEvents = button("Clear events", () => {
    events.replaceChildren();
  });
  const events = element("div");
  eventPanel.append(clearEvents, events);
  const diagnosticPanel = panel("Diagnostics");
  const diagnostics = element("div");
  diagnosticPanel.append(diagnostics);
  const side = element("aside");
  side.className = "details";
  append(side, nodePanel, eventPanel, diagnosticPanel);
  const layout = element("div");
  layout.className = "demo-layout";
  const visual = element("div");
  append(visual, viewerCard, summary);
  append(layout, visual, side);
  const jsonSection = element("section");
  jsonSection.className = "panel";
  const jsonHeading = element("h2", "Read-only JSON");
  const copyStatus = element("p");
  copyStatus.className = "notice";
  const copyJson = async (): Promise<void> => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(json);
      copyStatus.textContent = "JSON copied to clipboard.";
    } catch {
      copyStatus.textContent = "Could not copy JSON. Clipboard access is unavailable.";
    }
  };
  const copy = button("Copy JSON", () => {
    void copyJson();
  });
  const json = JSON.stringify(current.graph, null, 2);
  const pre = element("pre");
  pre.append(element("code", json));
  append(jsonSection, jsonHeading, copy, copyStatus, pre);
  append(shell, header, heading, controls, layout, jsonSection);
  appRoot.append(shell);
  const eventLog: Array<{ name: string; detail: unknown }> = [];
  const refreshDiagnostics = () => {
    const items = viewer.getDiagnostics();
    diagnosticSummary.textContent = `Diagnostics: ${items.length}`;
    renderDiagnostics(diagnostics, items);
  };
  const setOptions = (options: Partial<LineageViewerOptions>) => {
    viewer.setOptions(options);
    const directionSummary = summary.children[2];
    if (directionSummary) directionSummary.textContent = `Direction: ${viewer.options.direction}`;
    queueMicrotask(refreshDiagnostics);
  };
  for (const name of [
    "lineage-ready",
    "lineage-node-click",
    "lineage-selection-change",
    "lineage-error",
    "lineage-warning",
  ] as const)
    viewer.addEventListener(name, (event) => {
      eventLog.unshift({ name, detail: (event as CustomEvent).detail });
      eventLog.splice(20);
      renderEvents(events, eventLog);
    });
  viewer.addEventListener("lineage-selection-change", (event) => {
    const node = (event as CustomEvent<{ node: LineageNode | null }>).detail.node;
    selectedSummary.textContent = `Selected: ${node?.id ?? "none"}`;
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
  labelText: string,
  values: readonly string[],
  selected: string,
  listener: (value: string) => void,
): HTMLLabelElement {
  const label = element("label", labelText);
  const value = element("select");
  for (const item of values) {
    const option = element("option", item);
    option.value = item;
    option.selected = item === selected;
    value.append(option);
  }
  value.addEventListener("change", () => listener(value.value));
  label.append(value);
  return label;
}
function checkbox(
  text: string,
  checked: boolean,
  listener: (value: boolean) => void,
): HTMLLabelElement {
  const label = element("label");
  const input = element("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => listener(input.checked));
  append(label, input, text);
  return label;
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
    target.textContent = "No node selected.";
    target.className = "muted";
    return;
  }
  target.className = "";
  for (const [key, value] of [
    ["ID", node.id],
    ["Label", node.label],
    ["Type", node.type ?? "—"],
    ["Layer", node.layer ?? "—"],
    ["Subtitle", node.subtitle ?? "—"],
    ["Metadata", JSON.stringify(node.metadata ?? {}, null, 2)],
  ]) {
    const item = element("div");
    item.className = "detail";
    append(item, element("strong", key), element("span", value));
    target.append(item);
  }
}
function renderEvents(
  target: HTMLElement,
  values: readonly { name: string; detail: unknown }[],
): void {
  target.replaceChildren();
  for (const [index, value] of values.entries()) {
    const row = element("div", `${index + 1}. ${value.name}: ${safeJson(value.detail)}`);
    row.className = "event";
    target.append(row);
  }
  if (!values.length) target.append(element("p", "No events yet."));
}
function renderDiagnostics(target: HTMLElement, values: readonly LineageDiagnostic[]): void {
  target.replaceChildren();
  if (!values.length) {
    target.append(element("p", "No diagnostics"));
    return;
  }
  for (const item of values) {
    const row = element(
      "div",
      `[${item.level.toUpperCase()}] ${item.code}: ${item.message}${item.nodeId ? ` (${item.nodeId})` : ""}${item.edgeId ? ` (${item.edgeId})` : ""}`,
    );
    row.className = `diagnostic ${item.level}`;
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
