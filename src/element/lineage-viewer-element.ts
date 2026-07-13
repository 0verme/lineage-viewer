import { normalizeLineageGraphData, type NormalizedLineageGraph } from "../graph/index.js";
import { calculateInteractionState, ViewportController } from "../interactions/index.js";
import type { SceneBounds, ViewportFitOptions, ViewportSize } from "../interactions/viewport-types.js";
import { unionBounds } from "../interactions/viewport-math.js";
import { createLayeredRenderScene, type RenderScene, SvgRenderer } from "../render/index.js";
import type { LineageDiagnostic, LineageEdge, LineageGraphData } from "../schema/index.js";
import {
  defaultLineageViewerOptions,
  resolveOptions,
  type LineageViewerOptions,
  type ResolvedLineageViewerOptions,
} from "../public-api/options.js";
import type {
  LineageDiagnosticEventDetail,
  LineageNodeClickEventDetail,
  LineageReadyEventDetail,
  LineageSelectionChangeEventDetail,
} from "../public-api/events.js";
import { lineageViewerStyles } from "./styles.js";
import type { LineageViewerState } from "./element-state.js";

const ElementBase: typeof HTMLElement =
  typeof HTMLElement === "undefined" ? (class {} as typeof HTMLElement) : HTMLElement;
export class LineageViewerElement extends ElementBase {
  private readonly root: ShadowRoot;
  private renderer: SvgRenderer | null = null;
  private viewport: ViewportController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private state: LineageViewerState = "idle";
  private graph: NormalizedLineageGraph | null = null;
  private scene: RenderScene | null = null;
  private diagnostics: readonly LineageDiagnostic[] = [];
  private input: unknown = null;
  private resolvedOptions: ResolvedLineageViewerOptions = defaultLineageViewerOptions;
  private selectedId: string | null = null;
  private initialized = false;
  private readyDispatched = false;
  private drag: { pointerId: number; x: number; y: number; moved: boolean } | null = null;
  private suppressClick = false;
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
    return this.state === "destroyed" ? null : this.selectedId;
  }
  connectedCallback(): void {
    if (this.state === "destroyed") return;
    this.ensureInitialized();
    this.observe();
    this.process(false);
  }
  disconnectedCallback(): void {
    this.stopObserving();
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
    const layoutChanged =
      previous.direction !== this.resolvedOptions.direction ||
      previous.nodeWidth !== this.resolvedOptions.nodeWidth ||
      previous.nodeHeight !== this.resolvedOptions.nodeHeight ||
      previous.layerGap !== this.resolvedOptions.layerGap ||
      previous.nodeGap !== this.resolvedOptions.nodeGap;
    if (normalizationChanged) this.process(true);
    else if (layoutChanged && this.initialized) this.renderCurrent(true);
    else if (
      previous.fitOnLoad !== this.resolvedOptions.fitOnLoad &&
      this.resolvedOptions.fitOnLoad &&
      this.scene
    )
      this.viewport?.setScene(bounds(this.scene), this.size(), true);
    else if (previous.showEdgeLabels !== this.resolvedOptions.showEdgeLabels && this.initialized)
      this.renderCurrent(false);
    this.applyInteractionState();
  }
  getDiagnostics(): readonly LineageDiagnostic[] {
    return [...this.diagnostics];
  }
  fitView(): void {
    if (this.state !== "destroyed") this.viewport?.fit();
  }
  fitBounds(bounds: SceneBounds, options?: ViewportFitOptions): void {
    if (this.state !== "destroyed") this.viewport?.fitBounds(bounds, options);
  }
  fitNodes(nodeIds: readonly string[], options?: ViewportFitOptions): void {
    if (this.state === "destroyed" || nodeIds.length === 0) return;
    const nodes = nodeIds
      .map((nodeId) => this.findSceneNode(nodeId))
      .filter((node): node is RenderScene["nodes"][number] => node !== undefined);
    if (nodes.length === 0) return;
    const bounds = unionBounds(nodes.map((node) => node));
    if (bounds) this.viewport?.fitBounds(bounds, options);
  }
  resetView(): void {
    if (this.state !== "destroyed") this.viewport?.reset();
  }
  focusNode(nodeId: string): void {
    const node = this.findSceneNode(nodeId);
    if (node) this.viewport?.focus({ x: node.x + node.width / 2, y: node.y + node.height / 2 });
  }
  zoomBy(factor: number): void {
    const size = this.size();
    this.viewport?.zoom({ x: size.width / 2, y: size.height / 2 }, factor);
  }
  selectNode(nodeId: string): void {
    const id = nodeId.trim();
    if (this.graph?.nodeById.has(id)) this.updateSelection(id, "api");
  }
  clearSelection(): void {
    this.updateSelection(null, "api");
  }
  destroy(): void {
    if (this.state === "destroyed") return;
    this.stopObserving();
    this.renderer?.destroy();
    this.renderer = null;
    this.viewport?.destroy();
    this.viewport = null;
    this.root.replaceChildren();
    this.graph = null;
    this.scene = null;
    this.selectedId = null;
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
    this.viewport = new ViewportController((transform) =>
      this.renderer?.setViewportTransform(transform),
    );
    this.renderer.svg.addEventListener("wheel", this.onWheel, { passive: false });
    this.renderer.svg.addEventListener("pointerdown", this.onPointerDown);
    this.renderer.svg.addEventListener("pointermove", this.onPointerMove);
    this.renderer.svg.addEventListener("pointerup", this.onPointerEnd);
    this.renderer.svg.addEventListener("pointercancel", this.onPointerEnd);
    this.renderer.svg.addEventListener("click", this.onClick);
    this.initialized = true;
  }
  private process(emitEvents: boolean): void {
    if (this.state === "destroyed") return;
    if (this.input === null) {
      this.graph = null;
      this.diagnostics = [];
      this.state = "idle";
      this.clearForData();
      this.renderCurrent(true);
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
    if (this.selectedId !== null && !this.graph?.nodeById.has(this.selectedId))
      this.updateSelection(null, "data");
    this.renderCurrent(true);
    if (emitEvents && this.isConnected) this.emitDiagnostics();
    if (
      !this.readyDispatched &&
      this.isConnected &&
      (this.state === "empty" || this.state === "rendered")
    ) {
      this.readyDispatched = true;
      this.dispatchEvent(
        new CustomEvent<LineageReadyEventDetail>("lineage-ready", {
          detail: {
            nodeCount: this.graph?.nodes.length ?? 0,
            edgeCount: this.graph?.edges.length ?? 0,
            state: this.state,
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
  private clearForData(): void {
    if (this.selectedId !== null) this.updateSelection(null, "data");
  }
  private renderCurrent(newScene: boolean): void {
    if (!this.initialized || this.renderer === null) return;
    this.renderer.clear();
    this.root.querySelector(".state")?.remove();
    this.scene = null;
    if (this.state === "rendered" && this.graph !== null) {
      this.scene = createLayeredRenderScene(this.graph, this.resolvedOptions);
      this.renderer.render(this.scene, this.resolvedOptions);
      const size = this.size();
      this.renderer.setViewportSize(size.width, size.height);
      if (newScene)
        this.viewport?.setScene(bounds(this.scene), size, this.resolvedOptions.fitOnLoad);
      this.applyInteractionState();
      return;
    }
    this.viewport?.setScene(null, this.size(), false);
    const container = document.createElement("div");
    container.className = "state";
    container.dataset["kind"] = this.state;
    const primary = document.createElement("p");
    primary.textContent =
      this.state === "empty"
        ? "No lineage nodes"
        : this.state === "invalid"
          ? "Unable to render lineage data"
          : "No lineage data";
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
  private applyInteractionState(): void {
    this.renderer?.setInteractionState(
      calculateInteractionState(this.graph, this.selectedId, this.resolvedOptions.highlightMode),
    );
  }
  private updateSelection(next: string | null, source: "pointer" | "api" | "data"): void {
    if (next === this.selectedId) return;
    const previousSelectedNodeId = this.selectedId;
    this.selectedId = next;
    this.applyInteractionState();
    const node = next === null ? null : (this.graph?.nodeById.get(next) ?? null);
    this.dispatchEvent(
      new CustomEvent<LineageSelectionChangeEventDetail>("lineage-selection-change", {
        detail: {
          selectedNodeId: next,
          previousSelectedNodeId,
          node: node === null ? null : { ...node },
          source,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
  private findSceneNode(value: string): RenderScene["nodes"][number] | undefined {
    const id = value.trim();
    return id ? this.scene?.nodes.find((node) => node.id === id) : undefined;
  }
  private readonly onWheel = (event: WheelEvent): void => {
    if (this.state !== "rendered") return;
    event.preventDefault();
    const point = this.eventPoint(event);
    this.viewport?.zoom(point, Math.exp(-event.deltaY * 0.002));
  };
  private readonly onPointerDown = (event: PointerEvent): void => {
    if (
      event.button !== 0 ||
      this.state !== "rendered" ||
      (event.target instanceof Element && event.target.closest(".node"))
    )
      return;
    this.drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    this.renderer?.svg.setPointerCapture(event.pointerId);
    this.renderer?.svg.setAttribute("data-panning", "");
  };
  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const x = event.clientX - this.drag.x;
    const y = event.clientY - this.drag.y;
    if (Math.abs(x) + Math.abs(y) > 3) this.drag.moved = true;
    this.drag.x = event.clientX;
    this.drag.y = event.clientY;
    this.viewport?.pan(x, y);
  };
  private readonly onPointerEnd = (event: PointerEvent): void => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this.suppressClick = this.drag.moved;
    if (this.renderer?.svg.hasPointerCapture(event.pointerId))
      this.renderer.svg.releasePointerCapture(event.pointerId);
    this.drag = null;
    this.renderer?.svg.removeAttribute("data-panning");
  };
  private readonly onClick = (event: MouseEvent): void => {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    const target =
      event.target instanceof Element ? event.target.closest<SVGGElement>(".node") : null;
    const id = target?.dataset["nodeId"];
    if (id && this.graph) {
      const node = this.graph.nodeById.get(id);
      if (!node) return;
      this.dispatchEvent(
        new CustomEvent<LineageNodeClickEventDetail>("lineage-node-click", {
          detail: { nodeId: id, node: { ...node } },
          bubbles: true,
          composed: true,
        }),
      );
      this.updateSelection(id, "pointer");
    } else this.updateSelection(null, "pointer");
  };
  private eventPoint(event: MouseEvent): { x: number; y: number } {
    const rect = this.renderer?.svg.getBoundingClientRect();
    const size = this.size();
    return rect && rect.width > 0 && rect.height > 0
      ? {
          x: ((event.clientX - rect.left) * size.width) / rect.width,
          y: ((event.clientY - rect.top) * size.height) / rect.height,
        }
      : { x: 0, y: 0 };
  }
  private size(): ViewportSize {
    const rect = this.renderer?.svg.getBoundingClientRect();
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
  }
  private observe(): void {
    if (this.resizeObserver || typeof ResizeObserver === "undefined") return;
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || this.state === "destroyed") return;
      const { width, height } = entry.contentRect;
      this.renderer?.setViewportSize(width, height);
      this.viewport?.resize({ width, height }, this.resolvedOptions.fitOnLoad);
    });
    this.resizeObserver.observe(this);
  }
  private stopObserving(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
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
    this.dispatchEvent(
      new CustomEvent<LineageDiagnosticEventDetail>(name, {
        detail: { diagnostics: diagnostics.map((item) => ({ ...item })), hasErrors },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
function bounds(scene: RenderScene) {
  return { x: 0, y: 0, width: scene.width, height: scene.height };
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
