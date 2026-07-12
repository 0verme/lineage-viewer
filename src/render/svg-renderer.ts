import type { ResolvedLineageViewerOptions } from "../public-api/options.js";
import type { InteractionState } from "../interactions/index.js";
import type { ViewportTransform } from "../interactions/viewport-types.js";
import type { RenderScene } from "./types.js";

const svgNs = "http://www.w3.org/2000/svg";
let rendererCount = 0;
export class SvgRenderer {
  readonly svg: SVGSVGElement;
  private readonly viewportGroup: SVGGElement;
  private readonly sceneGroup: SVGGElement;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private readonly markerId = `lineage-viewer-arrow-${++rendererCount}`;
  private destroyed = false;
  constructor(host: ShadowRoot) {
    this.svg = create("svg");
    this.svg.setAttribute("part", "svg");
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const defs = create("defs");
    const marker = create("marker");
    marker.setAttribute("id", this.markerId);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "7");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("orient", "auto-start-reverse");
    const arrow = create("path");
    arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    arrow.setAttribute("class", "arrow");
    marker.append(arrow);
    defs.append(marker);
    this.viewportGroup = create("g");
    this.viewportGroup.setAttribute("class", "viewport");
    this.sceneGroup = create("g");
    this.sceneGroup.setAttribute("class", "scene");
    this.viewportGroup.append(this.sceneGroup);
    this.svg.append(defs, this.viewportGroup);
    host.append(this.svg);
  }
  render(scene: RenderScene, options: ResolvedLineageViewerOptions): void {
    if (this.destroyed) return;
    this.clear();
    const edges = create("g");
    edges.setAttribute("class", "edges");
    const nodes = create("g");
    nodes.setAttribute("class", "nodes");
    for (const item of scene.edges) {
      const path = create("path");
      path.setAttribute("class", "edge");
      path.setAttribute("d", item.path);
      path.setAttribute("marker-end", `url(#${this.markerId})`);
      path.setAttribute("data-edge-key", item.key);
      path.setAttribute("data-edge-source", item.edge.source);
      path.setAttribute("data-edge-target", item.edge.target);
      edges.append(path);
      if (options.showEdgeLabels && item.edge.label) {
        const label = create("text");
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
      const group = create("g");
      group.setAttribute("class", "node");
      group.setAttribute("transform", `translate(${item.x} ${item.y})`);
      group.setAttribute("data-node-id", item.id);
      if (item.rank !== undefined) group.setAttribute("data-node-layer", String(item.rank));
      if (item.node.type) group.setAttribute("data-node-type", item.node.type);
      if (item.node.status) group.setAttribute("data-node-status", item.node.status);
      const rect = create("rect");
      rect.setAttribute("width", String(item.width));
      rect.setAttribute("height", String(item.height));
      rect.setAttribute("rx", "8");
      const clipId = `${this.markerId}-node-text-${index}`;
      const clipPath = create("clipPath");
      clipPath.setAttribute("id", clipId);
      const clipRect = create("rect");
      clipRect.setAttribute("x", "16");
      clipRect.setAttribute("width", String(Math.max(0, item.width - 32)));
      clipRect.setAttribute("height", String(item.height));
      clipPath.append(clipRect);
      const tooltip = create("title");
      tooltip.textContent = item.node.subtitle
        ? `${item.node.label}\n${item.node.subtitle}`
        : item.node.label;
      const title = create("text");
      title.setAttribute("class", "node-title");
      title.setAttribute("x", "16");
      title.setAttribute("y", "30");
      title.setAttribute("clip-path", `url(#${clipId})`);
      title.textContent = item.node.label;
      group.append(clipPath, tooltip, rect, title);
      if (item.node.subtitle) {
        const subtitle = create("text");
        subtitle.setAttribute("class", "node-subtitle");
        subtitle.setAttribute("x", "16");
        subtitle.setAttribute("y", "52");
        subtitle.setAttribute("clip-path", `url(#${clipId})`);
        subtitle.textContent = item.node.subtitle;
        group.append(subtitle);
      }
      nodes.append(group);
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
function create<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(svgNs, name);
}
