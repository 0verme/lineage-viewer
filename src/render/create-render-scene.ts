import { layoutLineageGraph } from "../layout/index.js";
import type { NormalizedLineageGraph } from "../graph/types.js";
import type { ResolvedLineageViewerOptions } from "../public-api/options.js";
import type { RenderEdge, RenderNode, RenderScene } from "./types.js";

export function createLayeredRenderScene(
  graph: NormalizedLineageGraph,
  options: ResolvedLineageViewerOptions,
): RenderScene {
  const layout = layoutLineageGraph(graph, options);
  const nodes: RenderNode[] = layout.nodes.map((position) => ({
    ...position,
    node: graph.nodeById.get(position.id)!,
  }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: RenderEdge[] = graph.edges.flatMap((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    return source === undefined || target === undefined
      ? []
      : [{ key: edge.key, edge, path: routeEdge(source, target, options.direction, edge.key) }];
  });
  return { width: layout.width, height: layout.height, nodes, edges };
}

function routeEdge(
  source: RenderNode,
  target: RenderNode,
  direction: ResolvedLineageViewerOptions["direction"],
  key: string,
): string {
  if (source.id === target.id) return selfLoop(source, direction);
  const vertical = direction === "TB" || direction === "BT";
  const forward = direction === "LR" || direction === "TB";
  const sameRank = source.rank === target.rank;
  if (sameRank) return sameLayerCurve(source, target, vertical, key);
  if (vertical) {
    const start = { x: source.x + source.width / 2, y: source.y + (forward ? source.height : 0) };
    const end = { x: target.x + target.width / 2, y: target.y + (forward ? 0 : target.height) };
    const middle = (start.y + end.y) / 2;
    return `M ${start.x} ${start.y} C ${start.x} ${middle}, ${end.x} ${middle}, ${end.x} ${end.y}`;
  }
  const start = { x: source.x + (forward ? source.width : 0), y: source.y + source.height / 2 };
  const end = { x: target.x + (forward ? 0 : target.width), y: target.y + target.height / 2 };
  const middle = (start.x + end.x) / 2;
  return `M ${start.x} ${start.y} C ${middle} ${start.y}, ${middle} ${end.y}, ${end.x} ${end.y}`;
}

function sameLayerCurve(
  source: RenderNode,
  target: RenderNode,
  vertical: boolean,
  key: string,
): string {
  const offset = 28 + (stableOffset(key) % 3) * 12;
  if (vertical) {
    const startX = source.x + source.width / 2;
    const endX = target.x + target.width / 2;
    const y = Math.min(source.y, target.y) - offset;
    return `M ${startX} ${source.y} C ${startX} ${y}, ${endX} ${y}, ${endX} ${target.y}`;
  }
  const startY = source.y + source.height / 2;
  const endY = target.y + target.height / 2;
  const x = Math.min(source.x, target.x) - offset;
  return `M ${source.x} ${startY} C ${x} ${startY}, ${x} ${endY}, ${target.x} ${endY}`;
}

function selfLoop(node: RenderNode, direction: ResolvedLineageViewerOptions["direction"]): string {
  const vertical = direction === "TB" || direction === "BT";
  if (vertical) {
    const x = node.x + node.width / 2;
    const y = node.y;
    return `M ${x} ${y} C ${x + 40} ${y - 36}, ${x - 40} ${y - 36}, ${x} ${y}`;
  }
  const x = node.x + node.width;
  const y = node.y + node.height / 2;
  return `M ${x} ${y} C ${x + 40} ${y - 36}, ${x + 40} ${y + 36}, ${x} ${y + 1}`;
}

function stableOffset(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1)
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}
