import {
  buildAdjacencyIndexes,
  detectCycleGroups,
  type NormalizedLineageEdge,
  type NormalizedLineageGraph,
  type NormalizedLineageNode,
} from "../graph/index.js";
import type { LineageViewMode } from "../public-api/options.js";

export function createLineageViewGraph(
  graph: NormalizedLineageGraph,
  mode: LineageViewMode,
): NormalizedLineageGraph {
  if (mode === "mixed") return graph;

  const nodes = mode === "table" ? graph.nodes.map(withoutFields) : graph.nodes;
  const edges =
    mode === "table" ? collapseToTableEdges(graph.edges) : graph.edges.filter(isColumnEdge);
  const indexes = buildAdjacencyIndexes(nodes, edges);
  return {
    schemaVersion: graph.schemaVersion,
    nodes,
    edges,
    ...indexes,
    cycleGroups: detectCycleGroups(
      nodes.map((node) => node.id),
      edges,
    ),
  };
}

function withoutFields(node: NormalizedLineageNode): NormalizedLineageNode {
  const clone = { ...node };
  delete clone.fields;
  return clone;
}

function collapseToTableEdges(
  edges: readonly NormalizedLineageEdge[],
): readonly NormalizedLineageEdge[] {
  const tableEdges = edges.filter((edge) => !isColumnEdge(edge));
  const representedEndpoints = new Set(
    tableEdges.map((edge) => JSON.stringify([edge.source, edge.target])),
  );
  const derived: NormalizedLineageEdge[] = [];
  for (const edge of edges) {
    if (!isColumnEdge(edge)) continue;
    const endpointKey = JSON.stringify([edge.source, edge.target]);
    if (representedEndpoints.has(endpointKey)) continue;
    representedEndpoints.add(endpointKey);
    derived.push({
      source: edge.source,
      target: edge.target,
      key: JSON.stringify(["table-view", endpointKey]),
      type: edge.type,
      label: "",
    });
  }
  return [...tableEdges, ...derived];
}

function isColumnEdge(edge: NormalizedLineageEdge): boolean {
  return edge.sourceField !== undefined && edge.targetField !== undefined;
}
