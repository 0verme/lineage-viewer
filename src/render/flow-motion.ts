import type { NormalizedLineageGraph } from "../graph/types.js";
import { fieldReferenceKey, traverseFieldLineage } from "../interactions/field-traversal.js";
import type { FieldReference } from "../interactions/field-traversal.js";
import { createSvgElement } from "./svg-dom.js";

export const MAX_FLOW_PATHS = 48;
export const MAX_FLOW_PARTICLES = 48;
const PARTICLE_DURATION_MS = 1_800;
const PARTICLE_STAGGER_MS = 16;

type HighlightMode = "connected" | "both" | "upstream" | "downstream" | "none";
export type FlowDirection = "forward" | "reverse";

export interface DirectedFlowEdge {
  readonly key: string;
  readonly direction: FlowDirection;
}

interface FlowPath extends DirectedFlowEdge {
  readonly path: SVGPathElement;
}
interface ActiveParticle {
  readonly circle: SVGCircleElement;
  readonly path: SVGPathElement;
  readonly length: number;
  readonly direction: FlowDirection;
  readonly delay: number;
}

/** Build a cycle-safe walk from the selected table or field. */
export function getDirectedFlowEdges(
  graph: NormalizedLineageGraph | null,
  selectedNodeId: string | null,
  selectedField: FieldReference | null,
  mode: HighlightMode,
): readonly DirectedFlowEdge[] {
  if (graph === null || mode === "none") return [];
  const traversalMode = mode === "connected" ? "both" : mode;
  if (selectedField !== null) return walkFieldEdges(graph, selectedField, traversalMode);
  if (selectedNodeId === null || !graph.nodeById.has(selectedNodeId)) return [];
  return walkNodeEdges(graph, selectedNodeId, traversalMode);
}

export function isFlowWithinPathLimit(edges: readonly DirectedFlowEdge[]): boolean {
  return edges.length <= MAX_FLOW_PATHS && edges.length <= MAX_FLOW_PARTICLES;
}

function walkNodeEdges(
  graph: NormalizedLineageGraph,
  start: string,
  mode: Exclude<HighlightMode, "none" | "connected">,
): readonly DirectedFlowEdge[] {
  const queue = [start];
  const visitedNodes = new Set([start]);
  const visitedEdges = new Set<string>();
  const result: DirectedFlowEdge[] = [];
  const follow = (edge: NormalizedLineageGraph["edges"][number], direction: FlowDirection) => {
    if (visitedEdges.has(edge.key)) return;
    visitedEdges.add(edge.key);
    result.push({ key: edge.key, direction });
    const next = direction === "forward" ? edge.target : edge.source;
    if (!visitedNodes.has(next)) {
      visitedNodes.add(next);
      queue.push(next);
    }
  };

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    if (mode !== "upstream")
      for (const edge of graph.outgoingByNodeId.get(current) ?? []) follow(edge, "forward");
    if (mode !== "downstream")
      for (const edge of graph.incomingByNodeId.get(current) ?? []) follow(edge, "reverse");
  }
  return result;
}

function walkFieldEdges(
  graph: NormalizedLineageGraph,
  start: FieldReference,
  mode: Exclude<HighlightMode, "none" | "connected">,
): readonly DirectedFlowEdge[] {
  const traversal = traverseFieldLineage(graph, start, mode);
  if (traversal.edgeKeys.size === 0) return [];
  const incoming = new Map<string, NormalizedLineageGraph["edges"][number][]>();
  const outgoing = new Map<string, NormalizedLineageGraph["edges"][number][]>();
  for (const edge of graph.edges) {
    if (
      !traversal.edgeKeys.has(edge.key) ||
      edge.sourceField === undefined ||
      edge.targetField === undefined
    )
      continue;
    append(outgoing, fieldReferenceKey({ nodeId: edge.source, fieldId: edge.sourceField }), edge);
    append(incoming, fieldReferenceKey({ nodeId: edge.target, fieldId: edge.targetField }), edge);
  }

  const startKey = fieldReferenceKey(start);
  const queue = [startKey];
  const visitedFields = new Set([startKey]);
  const visitedEdges = new Set<string>();
  const result: DirectedFlowEdge[] = [];
  const follow = (edge: NormalizedLineageGraph["edges"][number], direction: FlowDirection) => {
    if (visitedEdges.has(edge.key)) return;
    visitedEdges.add(edge.key);
    result.push({ key: edge.key, direction });
    const next = fieldReferenceKey(
      direction === "forward"
        ? { nodeId: edge.target, fieldId: edge.targetField! }
        : { nodeId: edge.source, fieldId: edge.sourceField! },
    );
    if (!visitedFields.has(next)) {
      visitedFields.add(next);
      queue.push(next);
    }
  };

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    if (mode !== "upstream")
      for (const edge of outgoing.get(current) ?? []) follow(edge, "forward");
    if (mode !== "downstream")
      for (const edge of incoming.get(current) ?? []) follow(edge, "reverse");
  }
  return result;
}

function append<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const values = map.get(key);
  if (values) values.push(value);
  else map.set(key, [value]);
}

/** Plays one finite, non-interactive particle pass over the renderer's existing edge paths. */
export class FlowMotionController {
  private readonly particlesLayer: SVGGElement;
  private readonly activePaths = new Set<SVGPathElement>();
  private particles: ActiveParticle[] = [];
  private frameId: number | null = null;
  private startTime: number | null = null;
  private mediaQuery: MediaQueryList | null = null;
  private listening = false;
  private destroyed = false;

  constructor(parent: SVGGElement) {
    this.particlesLayer = createSvgElement("g");
    this.particlesLayer.setAttribute("class", "flow-particles");
    this.particlesLayer.setAttribute("aria-hidden", "true");
    this.particlesLayer.setAttribute("pointer-events", "none");
    parent.append(this.particlesLayer);
  }

  play(paths: readonly FlowPath[]): void {
    this.stop();
    if (
      this.destroyed ||
      paths.length === 0 ||
      !isFlowWithinPathLimit(paths) ||
      typeof globalThis.requestAnimationFrame !== "function" ||
      isMotionReduced() ||
      (typeof document !== "undefined" && document.hidden)
    )
      return;

    const validPaths: Array<{ path: SVGPathElement; direction: FlowDirection; length: number }> =
      [];
    for (const item of paths) {
      try {
        const length = item.path.getTotalLength();
        if (Number.isFinite(length) && length > 0)
          validPaths.push({ path: item.path, direction: item.direction, length });
      } catch {
        // Unsupported or malformed SVG path geometry falls back to static highlighting.
      }
    }
    if (validPaths.length === 0) return;

    validPaths.forEach((item, index) => {
      item.path.setAttribute("data-flowing", "");
      this.activePaths.add(item.path);
      const circle = createSvgElement("circle");
      circle.setAttribute("class", "flow-particle");
      circle.setAttribute("r", "4");
      circle.setAttribute("opacity", "0");
      circle.setAttribute("data-flow-edge-key", item.path.dataset["edgeKey"] ?? "");
      circle.setAttribute("data-flow-direction", item.direction);
      this.particlesLayer.append(circle);
      this.particles.push({
        circle,
        path: item.path,
        length: item.length,
        direction: item.direction,
        delay: index * PARTICLE_STAGGER_MS,
      });
    });
    this.listenForEnvironmentChanges();
    this.frameId = globalThis.requestAnimationFrame(this.animate);
  }

  stop(): void {
    if (this.frameId !== null && typeof globalThis.cancelAnimationFrame === "function")
      globalThis.cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.startTime = null;
    for (const path of this.activePaths) path.removeAttribute("data-flowing");
    this.activePaths.clear();
    this.particles = [];
    this.particlesLayer.replaceChildren();
    this.stopListeningForEnvironmentChanges();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.stop();
    this.particlesLayer.remove();
    this.destroyed = true;
  }

  private readonly animate = (timestamp: number): void => {
    this.frameId = null;
    if (this.destroyed) return;
    this.startTime ??= timestamp;
    const elapsed = timestamp - this.startTime;
    let unfinished = false;
    for (const particle of this.particles) {
      const localTime = elapsed - particle.delay;
      if (localTime < 0) {
        unfinished = true;
        continue;
      }
      if (localTime >= PARTICLE_DURATION_MS) continue;
      unfinished = true;
      const progress = localTime / PARTICLE_DURATION_MS;
      const distance =
        particle.length * (particle.direction === "forward" ? progress : 1 - progress);
      try {
        const point = particle.path.getPointAtLength(distance);
        particle.circle.setAttribute("cx", String(point.x));
        particle.circle.setAttribute("cy", String(point.y));
        const fade = Math.min(1, progress * 8, (1 - progress) * 8);
        particle.circle.setAttribute("opacity", String(Math.max(0, fade)));
      } catch {
        particle.circle.setAttribute("opacity", "0");
      }
    }
    if (!unfinished) {
      this.stop();
      return;
    }
    if (typeof globalThis.requestAnimationFrame === "function")
      this.frameId = globalThis.requestAnimationFrame(this.animate);
    else this.stop();
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.stop();
  };

  private readonly onMotionPreferenceChange = (event: MediaQueryListEvent): void => {
    if (event.matches) this.stop();
  };

  private listenForEnvironmentChanges(): void {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.onVisibilityChange);
      this.listening = true;
    }
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      this.mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.mediaQuery.addEventListener("change", this.onMotionPreferenceChange);
      this.listening = true;
    }
  }

  private stopListeningForEnvironmentChanges(): void {
    if (!this.listening) return;
    if (typeof document !== "undefined")
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.mediaQuery?.removeEventListener("change", this.onMotionPreferenceChange);
    this.mediaQuery = null;
    this.listening = false;
  }
}

function isMotionReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
