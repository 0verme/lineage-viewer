import { defineLineageViewer } from "lineage-viewer";
import type {
  LineageDiagnostic,
  LineageGraphData,
  LineageNode,
  LineageViewerElement,
  LineageViewerOptions,
} from "lineage-viewer";

import { cloneGraph, demos, findDemo } from "./demo-registry.js";
import { append, element, installStyles, link } from "./dom.js";
import { parseJson, type JsonParseResult } from "./playground-utils.js";
import { styles } from "./styles.js";

defineLineageViewer();

installStyles(styles);

const app = document.querySelector("#app");
if (!app) throw new Error("Playground root is missing.");

const MAX_FILE_BYTES = 2 * 1024 * 1024;
type Direction = NonNullable<LineageViewerOptions["direction"]>;
type HighlightMode = NonNullable<LineageViewerOptions["highlightMode"]>;
type Source = "demo" | "file" | "manual";
interface PlaygroundState {
  rawText: string;
  autoRender: boolean;
  revision: number;
  appliedRevision: number;
  selectedDemoId: string | null;
  source: Source;
  parseResult: JsonParseResult;
}

const queryDemoId = new URLSearchParams(location.search).get("demo");
const initialDemo = findDemo(queryDemoId) ?? demos[0];
if (!initialDemo) throw new Error("Playground requires a demo.");
const state: PlaygroundState = {
  rawText: JSON.stringify(cloneGraph(initialDemo.graph), null, 2),
  autoRender: true,
  revision: 0,
  appliedRevision: -1,
  selectedDemoId: initialDemo.id,
  source: "demo",
  parseResult: null,
};
let timer: number | undefined;
let hasPreview = false;

const shell = element("main");
shell.className = "shell playground";
const header = element("header");
append(
  header,
  link("./", "Back to gallery", "brand"),
  element("span", "JSON Playground"),
  element("span", "Local-only: JSON stays in your browser."),
);
const heading = element("section");
heading.className = "playground-heading";
append(
  heading,
  element("p", "JSON Playground"),
  element("h1", "Try your lineage JSON locally"),
  element(
    "p",
    "Parse JSON in the browser, then preview it with the same viewer used by the gallery.",
  ),
);
if (queryDemoId && !findDemo(queryDemoId)) {
  const notice = element("p", "Unknown demo ID: loaded the default sample instead.");
  notice.className = "notice";
  heading.append(notice);
}

const editorPanel = panel("JSON editor");
const toolbar = element("div");
toolbar.className = "controls toolbar";
const textarea = element("textarea");
textarea.value = state.rawText;
textarea.spellcheck = false;
textarea.autocomplete = "off";
textarea.autocapitalize = "off";
textarea.setAttribute("aria-label", "Lineage JSON editor");
const parseStatus = element("p", "Ready.");
parseStatus.className = "notice";
parseStatus.id = "parse-status";
parseStatus.setAttribute("aria-live", "polite");
textarea.setAttribute("aria-describedby", parseStatus.id);
const sample = element("select");
sample.setAttribute("aria-label", "Demo sample");
for (const demo of demos) {
  const option = element("option", demo.title);
  option.value = demo.id;
  option.selected = demo.id === initialDemo.id;
  sample.append(option);
}
const auto = element("input");
auto.type = "checkbox";
auto.checked = true;
const file = element("input");
file.type = "file";
file.accept = ".json,application/json";
file.hidden = true;
append(
  toolbar,
  button("Run", apply),
  labelWith("Auto-render", auto),
  button("Format", () => transform(2)),
  button("Minify", () => transform()),
  button("Copy", () => void copy()),
  button("Download", download),
  button("Import JSON", () => file.click()),
  button("Clear", () => setText("", "manual")),
  button("Reset to sample", resetSample),
  sample,
  file,
);
append(editorPanel, toolbar, textarea, parseStatus);

const previewPanel = panel("Interactive preview");
const viewerCard = element("div");
viewerCard.className = "viewer-card playground-viewer";
const viewer = document.createElement("lineage-viewer") as LineageViewerElement;
viewerCard.append(viewer);
const previewStatus = element("p", "Preview is current.");
previewStatus.className = "notice";
previewStatus.setAttribute("aria-live", "polite");
const controls = element("div");
controls.className = "controls";
append(
  controls,
  button("Fit view", () => viewer.fitView()),
  button("Reset view", () => viewer.resetView()),
  button("Clear selection", () => viewer.clearSelection()),
  select("Direction", ["LR", "RL", "TB", "BT"], "LR", (value) =>
    viewer.setOptions({ direction: value as Direction }),
  ),
  select("Highlight", ["connected", "upstream", "downstream", "none"], "connected", (value) =>
    viewer.setOptions({ highlightMode: value as HighlightMode }),
  ),
  checkbox("Show edge labels", false, (checked) => viewer.setOptions({ showEdgeLabels: checked })),
  checkbox("Show self-loops", Boolean(initialDemo.viewerOptions?.showSelfLoops), (checked) =>
    viewer.setOptions({ showSelfLoops: checked }),
  ),
  checkbox("Strict mode", false, (checked) => {
    viewer.setOptions({ validationMode: checked ? "strict" : "lenient" });
    apply();
  }),
);
append(previewPanel, controls, viewerCard, previewStatus);
const layout = element("div");
layout.className = "playground-layout";
append(layout, editorPanel, previewPanel);

const diagnosticPanel = panel("Diagnostics");
const diagnostics = element("div");
diagnosticPanel.append(diagnostics);
const eventPanel = panel("Recent events");
const events = element("div");
eventPanel.append(events);
const nodePanel = panel("Selected node");
const nodeDetails = element("p", "No node selected.");
nodeDetails.className = "muted";
nodePanel.append(nodeDetails);
const details = element("div");
details.className = "playground-details";
append(details, diagnosticPanel, eventPanel, nodePanel);
append(shell, header, heading, layout, details);
app.append(shell);

function setText(value: string, source: Source): void {
  textarea.value = value;
  state.rawText = value;
  state.source = source;
  state.revision++;
  schedule();
}
function schedule(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  if (!state.autoRender) return updatePreviewStatus();
  const revision = state.revision;
  timer = window.setTimeout(() => {
    timer = undefined;
    if (revision === state.revision) apply();
  }, 350);
  updatePreviewStatus();
}
function apply(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = undefined;
  state.parseResult = parseJson(state.rawText);
  if (state.parseResult === null) {
    parseStatus.textContent = "Enter or load lineage JSON to update the preview.";
    updatePreviewStatus();
    renderDiagnostics();
    return;
  }
  if (!state.parseResult.ok) {
    const locationText = state.parseResult.line
      ? ` Line ${state.parseResult.line}, column ${state.parseResult.column}.`
      : "";
    parseStatus.textContent = `Parse error: ${state.parseResult.message}.${locationText}`;
    updatePreviewStatus();
    renderDiagnostics();
    return;
  }
  viewer.setData(state.parseResult.value as LineageGraphData);
  state.appliedRevision = state.revision;
  hasPreview = true;
  parseStatus.textContent = "JSON parsed successfully.";
  updatePreviewStatus();
  queueMicrotask(renderDiagnostics);
}
function updatePreviewStatus(): void {
  if (!state.rawText.trim()) {
    previewStatus.textContent = hasPreview
      ? "Preview is showing the last successfully parsed JSON."
      : "No preview yet.";
  } else if (!state.autoRender && state.revision !== state.appliedRevision) {
    previewStatus.textContent = "The editor contains unapplied changes.";
  } else if (state.parseResult && !state.parseResult.ok) {
    previewStatus.textContent = "Preview is showing the last successfully parsed JSON.";
  } else previewStatus.textContent = "Preview is current.";
}
function transform(spacing?: number): void {
  const result = parseJson(state.rawText);
  if (!result?.ok) {
    state.parseResult = result;
    apply();
    return;
  }
  setText(JSON.stringify(result.value, null, spacing), "manual");
}
async function copy(): Promise<void> {
  try {
    if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(state.rawText);
    parseStatus.textContent = "JSON copied to clipboard.";
  } catch {
    parseStatus.textContent = "Could not copy JSON. Clipboard access is unavailable.";
  }
}
function download(): void {
  const blob = new Blob([state.rawText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    state.source === "demo" && state.selectedDemoId
      ? `${state.selectedDemoId}.json`
      : "lineage-graph.json";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  parseStatus.textContent = "Downloaded current editor contents.";
}
function resetSample(): void {
  const demo = findDemo(sample.value);
  if (!demo) return;
  state.selectedDemoId = demo.id;
  events.replaceChildren();
  viewer.clearSelection();
  setText(JSON.stringify(cloneGraph(demo.graph), null, 2), "demo");
}
textarea.addEventListener("input", () => setText(textarea.value, "manual"));
textarea.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    apply();
  }
});
auto.addEventListener("change", () => {
  state.autoRender = auto.checked;
  if (state.autoRender && state.revision !== state.appliedRevision) schedule();
  else updatePreviewStatus();
});
sample.addEventListener("change", resetSample);
file.addEventListener("change", () => {
  void importFile();
});
async function importFile(): Promise<void> {
  const selectedFile = file.files?.[0];
  file.value = "";
  if (!selectedFile) return;
  if (selectedFile.size > MAX_FILE_BYTES) {
    parseStatus.textContent = "Import rejected: files must be 2 MB or smaller.";
    return;
  }
  try {
    setText(await selectedFile.text(), "file");
  } catch {
    parseStatus.textContent = "Could not read the selected file.";
  }
}
for (const name of [
  "lineage-ready",
  "lineage-node-click",
  "lineage-selection-change",
  "lineage-error",
  "lineage-warning",
] as const) {
  viewer.addEventListener(name, (event) => {
    const row = element("div", `${name}: ${safeJson((event as CustomEvent).detail)}`);
    row.className = "event";
    events.prepend(row);
    while (events.children.length > 20) events.lastElementChild?.remove();
  });
}
viewer.addEventListener("lineage-selection-change", (event) =>
  renderNode(nodeDetails, (event as CustomEvent<{ node: LineageNode | null }>).detail.node),
);
function renderDiagnostics(): void {
  diagnostics.replaceChildren();
  if (state.parseResult && !state.parseResult.ok) {
    diagnostics.append(element("div", `JSON parse error: ${state.parseResult.message}`));
  }
  const values = viewer.getDiagnostics();
  if (!values.length && (!state.parseResult || state.parseResult.ok))
    diagnostics.append(element("p", "No viewer diagnostics."));
  for (const item of values) renderDiagnostic(item);
}
function renderDiagnostic(item: LineageDiagnostic): void {
  const row = element("div", `[${item.level.toUpperCase()}] ${item.code}: ${item.message}`);
  row.className = `diagnostic ${item.level}`;
  diagnostics.append(row);
}
function renderNode(target: HTMLElement, node: LineageNode | null): void {
  target.replaceChildren();
  if (!node) return void (target.textContent = "No node selected.");
  for (const [key, value] of [
    ["ID", node.id],
    ["Label", node.label],
    ["Metadata", JSON.stringify(node.metadata ?? {})],
  ]) {
    const row = element("div");
    row.className = "detail";
    append(row, element("strong", key), element("span", value));
    target.append(row);
  }
}
function panel(title: string): HTMLElement {
  const value = element("section");
  value.className = "panel";
  value.append(element("h2", title));
  return value;
}
function button(text: string, listener: () => void): HTMLButtonElement {
  const value = element("button", text);
  value.type = "button";
  value.addEventListener("click", listener);
  return value;
}
function labelWith(text: string, input: HTMLInputElement): HTMLLabelElement {
  const value = element("label");
  append(value, input, text);
  return value;
}
function checkbox(
  text: string,
  checked: boolean,
  listener: (value: boolean) => void,
): HTMLLabelElement {
  const input = element("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => listener(input.checked));
  return labelWith(text, input);
}
function select(
  text: string,
  values: readonly string[],
  initial: string,
  listener: (value: string) => void,
): HTMLLabelElement {
  const input = element("select");
  for (const value of values) {
    const option = element("option", value);
    option.value = value;
    option.selected = value === initial;
    input.append(option);
  }
  input.addEventListener("change", () => listener(input.value));
  const label = element("label", text);
  label.append(input);
  return label;
}
function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable detail]";
  }
}
apply();
