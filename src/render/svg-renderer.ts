import type { ResolvedLineageViewerOptions } from "../public-api/options.js";
import type { InteractionState } from "../interactions/index.js";
import { fieldReferenceKey } from "../interactions/index.js";
import type { SearchState } from "../search/index.js";
import type { ViewportTransform } from "../interactions/viewport-types.js";
import { NodeRenderer } from "./node-renderer.js";
import { createSvgElement } from "./svg-dom.js";
import type { RenderScene } from "./types.js";

let rendererCount = 0;
export class SvgRenderer {
  readonly svg: SVGSVGElement;
  private readonly viewportGroup: SVGGElement;
  private readonly sceneGroup: SVGGElement;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private readonly markerId = `lineage-viewer-arrow-${++rendererCount}`;
  private readonly nodeRenderer = new NodeRenderer(this.markerId);
  private destroyed = false;
  constructor(host: ShadowRoot) {
    this.svg = createSvgElement("svg");
    this.svg.setAttribute("part", "svg");
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const defs = createSvgElement("defs");
    const marker = createSvgElement("marker");
    marker.setAttribute("id", this.markerId);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "7");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("orient", "auto-start-reverse");
    const arrow = createSvgElement("path");
    arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    arrow.setAttribute("class", "arrow");
    marker.append(arrow);
    defs.append(marker);
    this.viewportGroup = createSvgElement("g");
    this.viewportGroup.setAttribute("class", "viewport");
    this.sceneGroup = createSvgElement("g");
    this.sceneGroup.setAttribute("class", "scene");
    this.viewportGroup.append(this.sceneGroup);
    this.svg.append(defs, this.viewportGroup);
    host.append(this.svg);
  }
  render(scene: RenderScene, options: ResolvedLineageViewerOptions): void {
    if (this.destroyed) return;
    this.clear();
    this.svg.setAttribute("data-view-mode", options.viewMode);
    const edges = createSvgElement("g");
    edges.setAttribute("class", "edges");
    const nodes = createSvgElement("g");
    nodes.setAttribute("class", "nodes");
    for (const item of scene.edges) {
      const path = createSvgElement("path");
      const isColumnEdge =
        item.edge.sourceField !== undefined && item.edge.targetField !== undefined;
      path.setAttribute("class", isColumnEdge ? "edge column-edge" : "edge table-edge");
      path.setAttribute("d", item.path);
      path.setAttribute("marker-end", `url(#${this.markerId})`);
      path.setAttribute("data-edge-key", item.key);
      path.setAttribute("data-edge-source", item.edge.source);
      path.setAttribute("data-edge-target", item.edge.target);
      if (item.edge.sourceField !== undefined)
        path.setAttribute("data-edge-source-field", item.edge.sourceField);
      if (item.edge.targetField !== undefined)
        path.setAttribute("data-edge-target-field", item.edge.targetField);
      edges.append(path);
      if (options.showEdgeLabels && item.edge.label) {
        const label = createSvgElement("text");
        label.setAttribute("class", "edge-label");
        label.setAttribute("x", String(item.labelX));
        label.setAttribute("y", String(item.labelY));
        label.setAttribute("dy", "-6");
        label.setAttribute("text-anchor", "middle");
        label.textContent = item.edge.label;
        edges.append(label);
      }
    }
    for (const [index, item] of scene.nodes.entries()) {
      nodes.append(this.nodeRenderer.render(item, index));
    }
    this.sceneGroup.append(edges, nodes);
  }
  clear(): void {
    this.sceneGroup.replaceChildren();
  }
  setViewportSize(width: number, height: number): void {
    if (
      width > 0 &&
      height > 0 &&
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      (width !== this.viewportWidth || height !== this.viewportHeight)
    ) {
      this.viewportWidth = width;
      this.viewportHeight = height;
      this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
  }
  setViewportTransform(transform: ViewportTransform): void {
    this.viewportGroup.setAttribute(
      "transform",
      `translate(${transform.translateX} ${transform.translateY}) scale(${transform.scale})`,
    );
  }
  setInteractionState(state: InteractionState): void {
    for (const node of this.sceneGroup.querySelectorAll<SVGGElement>(".node")) {
      const id = node.dataset["nodeId"];
      setFlag(node, "selected", id === state.selectedNodeId);
      setFlag(node, "highlighted", id !== undefined && state.highlightedNodeIds.has(id));
      setFlag(node, "dimmed", id !== undefined && state.dimmedNodeIds.has(id));
    }
    for (const edge of this.sceneGroup.querySelectorAll<SVGPathElement>(".edge")) {
      const key = edge.dataset["edgeKey"];
      setFlag(edge, "highlighted", key !== undefined && state.highlightedEdgeKeys.has(key));
      setFlag(edge, "dimmed", key !== undefined && state.dimmedEdgeKeys.has(key));
    }
    for (const field of this.sceneGroup.querySelectorAll<SVGGElement>(".field-row")) {
      const nodeId = field.closest<SVGGElement>(".node")?.dataset["nodeId"];
      const fieldId = field.dataset["fieldId"];
      if (nodeId === undefined || fieldId === undefined) continue;
      const key = fieldReferenceKey({ nodeId, fieldId });
      setFlag(field, "selected", key === state.selectedFieldKey);
      setFlag(field, "highlighted", state.highlightedFieldKeys.has(key));
      setFlag(field, "dimmed", state.dimmedFieldKeys.has(key));
    }
  }
  setSearchState(state: SearchState): void {
    for (const node of this.sceneGroup.querySelectorAll<SVGGElement>(".node")) {
      const id = node.dataset["nodeId"];
      setFlag(node, "search-match", id !== undefined && state.matchedNodeIds.has(id));
      setFlag(node, "search-dimmed", id !== undefined && state.dimmedNodeIds.has(id));
    }
    for (const edge of this.sceneGroup.querySelectorAll<SVGPathElement>(".edge")) {
      const key = edge.dataset["edgeKey"];
      setFlag(edge, "search-dimmed", key !== undefined && state.dimmedEdgeKeys.has(key));
    }
    for (const field of this.sceneGroup.querySelectorAll<SVGGElement>(".field-row")) {
      const nodeId = field.closest<SVGGElement>(".node")?.dataset["nodeId"];
      const fieldId = field.dataset["fieldId"];
      if (nodeId === undefined || fieldId === undefined) continue;
      const key = fieldReferenceKey({ nodeId, fieldId });
      setFlag(field, "search-match", state.matchedFieldKeys.has(key));
      setFlag(field, "search-dimmed", state.dimmedFieldKeys.has(key));
    }
  }
  destroy(): void {
    if (this.destroyed) return;
    this.clear();
    this.svg.remove();
    this.destroyed = true;
  }
}
function setFlag(element: Element, name: string, active: boolean): void {
  if (active) element.setAttribute(`data-${name}`, "");
  else element.removeAttribute(`data-${name}`);
}
