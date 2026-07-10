import {
  getConnectedNodeIds,
  getDownstreamNodeIds,
  getUpstreamNodeIds,
  type NormalizedLineageGraph,
} from "../graph/index.js";

export interface InteractionState {
  readonly selectedNodeId: string | null;
  readonly highlightedNodeIds: ReadonlySet<string>;
  readonly dimmedNodeIds: ReadonlySet<string>;
  readonly highlightedEdgeKeys: ReadonlySet<string>;
  readonly dimmedEdgeKeys: ReadonlySet<string>;
}

export function calculateInteractionState(
  graph: NormalizedLineageGraph | null,
  selectedNodeId: string | null,
  mode: "connected" | "upstream" | "downstream" | "none",
): InteractionState {
  if (graph === null || selectedNodeId === null || !graph.nodeById.has(selectedNodeId))
    return emptyState();
  if (mode === "none") return { ...emptyState(), selectedNodeId };
  const related =
    mode === "upstream"
      ? getUpstreamNodeIds(graph, selectedNodeId)
      : mode === "downstream"
        ? getDownstreamNodeIds(graph, selectedNodeId)
        : getConnectedNodeIds(graph, selectedNodeId);
  const active = new Set([selectedNodeId, ...related]);
  const highlightedNodeIds = new Set(related);
  const highlightedEdgeKeys = new Set(
    graph.edges
      .filter((edge) => active.has(edge.source) && active.has(edge.target))
      .map((edge) => edge.key),
  );
  return {
    selectedNodeId,
    highlightedNodeIds,
    dimmedNodeIds: new Set(graph.nodes.map((node) => node.id).filter((id) => !active.has(id))),
    highlightedEdgeKeys,
    dimmedEdgeKeys: new Set(
      graph.edges.filter((edge) => !highlightedEdgeKeys.has(edge.key)).map((edge) => edge.key),
    ),
  };
}
function emptyState(): InteractionState {
  return {
    selectedNodeId: null,
    highlightedNodeIds: new Set(),
    dimmedNodeIds: new Set(),
    highlightedEdgeKeys: new Set(),
    dimmedEdgeKeys: new Set(),
  };
}
