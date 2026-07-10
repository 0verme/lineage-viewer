import { normalizeLineageGraphData, type NormalizedLineageGraph } from "../graph/index.js";
import type { LineageDiagnostic, LineageEdge, LineageGraphData } from "../schema/index.js";
import { createLayeredRenderScene, SvgRenderer } from "../render/index.js";
import {
  defaultLineageViewerOptions,
  resolveOptions,
  type LineageViewerOptions,
  type ResolvedLineageViewerOptions,
} from "../public-api/options.js";
import type {
  LineageDiagnosticEventDetail,
  LineageReadyEventDetail,
} from "../public-api/events.js";
import { lineageViewerStyles } from "./styles.js";
import type { LineageViewerState } from "./element-state.js";

const ElementBase: typeof HTMLElement =
  typeof HTMLElement === "undefined" ? (class {} as typeof HTMLElement) : HTMLElement;
export class LineageViewerElement extends ElementBase {
  private readonly root: ShadowRoot;
  private renderer: SvgRenderer | null = null;
  private state: LineageViewerState = "idle";
  private graph: NormalizedLineageGraph | null = null;
  private diagnostics: readonly LineageDiagnostic[] = [];
  private input: unknown = null;
  private resolvedOptions: ResolvedLineageViewerOptions = defaultLineageViewerOptions;
  private initialized = false;
  private readyDispatched = false;
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }
  get data(): LineageGraphData | null {
    return this.graph === null
      ? null
      : {
          schemaVersion: this.graph.schemaVersion,
          nodes: this.graph.nodes.map((node) => ({ ...node })),
          edges: this.graph.edges.map(toPublicEdge),
        };
  }
  set data(data: LineageGraphData | null) {
    this.setData(data);
  }
  get options(): ResolvedLineageViewerOptions {
    return { ...this.resolvedOptions };
  }
  set options(options: Partial<LineageViewerOptions>) {
    this.setOptions(options);
  }
  get selectedNodeId(): string | null {
    return null;
  }
  connectedCallback(): void {
    if (this.state === "destroyed") return;
    this.ensureInitialized();
    this.process(false);
  }
  disconnectedCallback(): void {
    this.renderer?.clear();
  }
  setData(data: LineageGraphData | null): void {
    if (this.state === "destroyed") return;
    this.input = data;
    this.process(true);
  }
  setOptions(options: Partial<LineageViewerOptions>): void {
    if (this.state === "destroyed") return;
    const previous = this.resolvedOptions;
    this.resolvedOptions = resolveOptions(previous, options);
    const normalizationChanged =
      previous.validationMode !== this.resolvedOptions.validationMode ||
      previous.showSelfLoops !== this.resolvedOptions.showSelfLoops;
    if (normalizationChanged) this.process(true);
    else if (this.initialized) this.renderCurrent();
  }
  getDiagnostics(): readonly LineageDiagnostic[] {
    return [...this.diagnostics];
  }
  destroy(): void {
    if (this.state === "destroyed") return;
    this.renderer?.destroy();
    this.renderer = null;
    this.root.replaceChildren();
    this.graph = null;
    this.diagnostics = [];
    this.state = "destroyed";
  }
  private ensureInitialized(): void {
    if (this.initialized) return;
    const style = document.createElement("style");
    style.textContent = lineageViewerStyles;
    const container = document.createElement("div");
    container.className = "root";
    this.root.append(style, container);
    this.renderer = new SvgRenderer(this.root);
    this.initialized = true;
  }
  private process(emitEvents: boolean): void {
    if (this.state === "destroyed") return;
    if (this.input === null) {
      this.graph = null;
      this.diagnostics = [];
      this.state = "idle";
      this.renderCurrent();
      return;
    }
    const result = normalizeLineageGraphData(this.input, {
      validationMode: this.resolvedOptions.validationMode,
      showSelfLoops: this.resolvedOptions.showSelfLoops,
    });
    this.graph = result.graph;
    this.diagnostics = result.diagnostics;
    this.state =
      result.graph === null ? "invalid" : result.graph.nodes.length === 0 ? "empty" : "rendered";
    this.renderCurrent();
    if (emitEvents && this.isConnected) this.emitDiagnostics();
    if (
      !this.readyDispatched &&
      this.isConnected &&
      (this.state === "empty" || this.state === "rendered")
    ) {
      this.readyDispatched = true;
      const detail: LineageReadyEventDetail = {
        nodeCount: this.graph?.nodes.length ?? 0,
        edgeCount: this.graph?.edges.length ?? 0,
        state: this.state,
      };
      this.dispatchEvent(
        new CustomEvent("lineage-ready", { detail, bubbles: true, composed: true }),
      );
    }
  }
  private renderCurrent(): void {
    if (!this.initialized || this.renderer === null) return;
    this.renderer.clear();
    const stateNode = this.root.querySelector(".state");
    stateNode?.remove();
    if (this.state === "rendered" && this.graph !== null) {
      this.renderer.render(
        createLayeredRenderScene(this.graph, this.resolvedOptions),
        this.resolvedOptions,
      );
      return;
    }
    const message =
      this.state === "empty"
        ? "No lineage nodes"
        : this.state === "invalid"
          ? "Unable to render lineage data"
          : "No lineage data";
    const container = document.createElement("div");
    container.className = "state";
    container.dataset["kind"] = this.state;
    const primary = document.createElement("p");
    primary.textContent = message;
    container.append(primary);
    if (this.state === "invalid") {
      const first = this.diagnostics.find((item) => item.level === "error");
      if (first) {
        const summary = document.createElement("p");
        summary.textContent = first.message;
        container.append(summary);
      }
    }
    this.root.append(container);
  }
  private emitDiagnostics(): void {
    const errors = this.diagnostics.filter((item) => item.level === "error");
    const warnings = this.diagnostics.filter((item) => item.level === "warning");
    this.emit("lineage-error", errors, true);
    this.emit("lineage-warning", warnings, false);
  }
  private emit(
    name: "lineage-error" | "lineage-warning",
    diagnostics: readonly LineageDiagnostic[],
    hasErrors: boolean,
  ): void {
    if (diagnostics.length === 0) return;
    const detail: LineageDiagnosticEventDetail = {
      diagnostics: diagnostics.map((item) => ({ ...item })),
      hasErrors,
    };
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}

function toPublicEdge(edge: NormalizedLineageGraph["edges"][number]): LineageEdge {
  return {
    source: edge.source,
    target: edge.target,
    ...(edge.id === undefined ? {} : { id: edge.id }),
    ...(edge.label === "" ? {} : { label: edge.label }),
    ...(edge.type === "lineage" ? {} : { type: edge.type }),
    ...(edge.metadata === undefined ? {} : { metadata: edge.metadata }),
  };
}
