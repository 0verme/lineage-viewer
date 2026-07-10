import type { NormalizedLineageGraph } from "../graph/types.js";
import type { ResolvedLineageViewerOptions } from "../public-api/options.js";
import type { RenderEdge, RenderNode, RenderScene } from "./types.js";

const padding = 32;

/** This is a provisional Phase 3 placement strategy, not the deterministic layered layout. */
export function createBasicRenderScene(
  graph: NormalizedLineageGraph,
  options: ResolvedLineageViewerOptions,
): RenderScene {
  const vertical = options.direction === "TB" || options.direction === "BT";
  const reversed = options.direction === "RL" || options.direction === "BT";
  const ordered = reversed ? [...graph.nodes].reverse() : [...graph.nodes];
  const nodes: RenderNode[] = ordered.map((node, index) => ({
    id: node.id,
    x: vertical ? padding : padding + index * (options.nodeWidth + options.layerGap),
    y: vertical ? padding + index * (options.nodeHeight + options.layerGap) : padding,
    width: options.nodeWidth,
    height: options.nodeHeight,
    node,
  }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: RenderEdge[] = [];
  for (const edge of graph.edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (source === undefined || target === undefined) continue;
    edges.push({
      key: edge.key,
      edge,
      path: edge.source === edge.target ? selfLoop(source) : edgePath(source, target, vertical),
    });
  }
  const count = nodes.length;
  return {
    width: Math.max(
      1,
      vertical
        ? options.nodeWidth + padding * 2
        : count * options.nodeWidth + Math.max(0, count - 1) * options.layerGap + padding * 2,
    ),
    height: Math.max(
      1,
      vertical
        ? count * options.nodeHeight + Math.max(0, count - 1) * options.layerGap + padding * 2
        : options.nodeHeight + padding * 2,
    ),
    nodes,
    edges,
  };
}

function edgePath(source: RenderNode, target: RenderNode, vertical: boolean): string {
  const startX = vertical
    ? source.x + source.width / 2
    : source.x + (target.x >= source.x ? source.width : 0);
  const startY = vertical
    ? source.y + (target.y >= source.y ? source.height : 0)
    : source.y + source.height / 2;
  const endX = vertical
    ? target.x + target.width / 2
    : target.x + (target.x >= source.x ? 0 : target.width);
  const endY = vertical
    ? target.y + (target.y >= source.y ? 0 : target.height)
    : target.y + target.height / 2;
  return `M ${startX} ${startY} L ${endX} ${endY}`;
}
function selfLoop(node: RenderNode): string {
  const x = node.x + node.width;
  const y = node.y + node.height / 2;
  return `M ${x} ${y} C ${x + 28} ${y - 32}, ${x + 28} ${y + 32}, ${x} ${y + 20}`;
}
