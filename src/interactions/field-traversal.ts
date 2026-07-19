import type { NormalizedLineageEdge, NormalizedLineageGraph } from "../graph/index.js";

export interface FieldReference {
  readonly nodeId: string;
  readonly fieldId: string;
}

export type FieldTraversalMode = "both" | "upstream" | "downstream";

export interface FieldTraversalResult {
  readonly fieldKeys: ReadonlySet<string>;
  readonly edgeKeys: ReadonlySet<string>;
}

export function fieldReferenceKey(reference: FieldReference): string {
  return JSON.stringify([reference.nodeId, reference.fieldId]);
}

export function traverseFieldLineage(
  graph: NormalizedLineageGraph,
  start: FieldReference,
  mode: FieldTraversalMode,
): FieldTraversalResult {
  const startKey = fieldReferenceKey(start);
  if (!hasField(graph, start)) return { fieldKeys: new Set(), edgeKeys: new Set() };

  const incoming = new Map<string, NormalizedLineageEdge[]>();
  const outgoing = new Map<string, NormalizedLineageEdge[]>();
  for (const edge of graph.edges) {
    if (edge.sourceField === undefined || edge.targetField === undefined) continue;
    append(outgoing, fieldReferenceKey({ nodeId: edge.source, fieldId: edge.sourceField }), edge);
    append(incoming, fieldReferenceKey({ nodeId: edge.target, fieldId: edge.targetField }), edge);
  }

  const fieldKeys = new Set([startKey]);
  const edgeKeys = new Set<string>();
  const queue = [startKey];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    const candidates = [
      ...(mode === "downstream" ? [] : (incoming.get(current) ?? [])),
      ...(mode === "upstream" ? [] : (outgoing.get(current) ?? [])),
    ];
    for (const edge of candidates) {
      edgeKeys.add(edge.key);
      const sourceKey = fieldReferenceKey({
        nodeId: edge.source,
        fieldId: edge.sourceField!,
      });
      const targetKey = fieldReferenceKey({
        nodeId: edge.target,
        fieldId: edge.targetField!,
      });
      const next = sourceKey === current ? targetKey : sourceKey;
      if (fieldKeys.has(next)) continue;
      fieldKeys.add(next);
      queue.push(next);
    }
  }
  return { fieldKeys, edgeKeys };
}

function append(
  index: Map<string, NormalizedLineageEdge[]>,
  key: string,
  edge: NormalizedLineageEdge,
): void {
  const edges = index.get(key);
  if (edges) edges.push(edge);
  else index.set(key, [edge]);
}

function hasField(graph: NormalizedLineageGraph, reference: FieldReference): boolean {
  return (
    graph.nodeById
      .get(reference.nodeId)
      ?.fields?.some((field) => field.id === reference.fieldId) === true
  );
}
