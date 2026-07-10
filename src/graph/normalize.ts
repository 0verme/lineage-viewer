import { buildAdjacencyIndexes } from "./adjacency.js";
import { detectCycleGroups } from "./cycle-detection.js";
import type {
  NormalizeLineageGraphOptions,
  NormalizedLineageEdge,
  NormalizedLineageGraph,
  NormalizedLineageNode,
} from "./types.js";
import { sortDiagnostics, type LineageDiagnostic } from "../schema/diagnostics.js";
import type { LineageEdgeType } from "../schema/types.js";
import {
  invalid,
  isEdgeType,
  isNodeStatus,
  isNodeType,
  isNonEmptyString,
  isPlainRecord,
  validateLineageGraphData,
} from "../schema/validate.js";

export interface NormalizeLineageGraphResult {
  readonly graph: NormalizedLineageGraph | null;
  readonly diagnostics: readonly LineageDiagnostic[];
  readonly hasErrors: boolean;
}

export function normalizeLineageGraphData(
  input: unknown,
  options: NormalizeLineageGraphOptions = {},
): NormalizeLineageGraphResult {
  const rootDiagnostics = validateLineageGraphData(input);
  if (
    rootDiagnostics.length > 0 ||
    !isPlainRecord(input) ||
    !Array.isArray(input["nodes"]) ||
    !Array.isArray(input["edges"])
  ) {
    return result(null, rootDiagnostics);
  }
  const diagnostics: LineageDiagnostic[] = [];
  const nodeById = new Map<string, NormalizedLineageNode>();
  for (const candidate of input["nodes"]) {
    const node = normalizeNode(candidate, diagnostics);
    if (node === null) continue;
    if (nodeById.has(node.id)) {
      diagnostics.push({
        level: "error",
        code: "DUPLICATE_NODE_ID",
        nodeId: node.id,
        message: `Duplicate node id "${node.id}"; first valid occurrence wins.`,
      });
      continue;
    }
    nodeById.set(node.id, node);
  }

  const edgesByKey = new Map<string, NormalizedLineageEdge>();
  for (const candidate of input["edges"]) {
    const edge = normalizeEdge(candidate, nodeById, diagnostics);
    if (edge === null) continue;
    if (edge.source === edge.target && options.showSelfLoops !== true) {
      diagnostics.push({
        level: "warning",
        code: "SELF_LOOP_HIDDEN",
        message: `Self-loop at "${edge.source}" was hidden.`,
        ...(edge.id === undefined ? {} : { edgeId: edge.id }),
      });
      continue;
    }
    if (edgesByKey.has(edge.key)) {
      diagnostics.push({
        level: "warning",
        code: "DUPLICATE_EDGE",
        message: `Duplicate edge "${edge.key}" was removed; first valid occurrence wins.`,
        ...(edge.id === undefined ? {} : { edgeId: edge.id }),
      });
      continue;
    }
    edgesByKey.set(edge.key, edge);
  }

  const nodes = [...nodeById.values()].sort(compareNodes);
  const edges = [...edgesByKey.values()].sort(compareEdges);
  if (nodes.length === 0)
    diagnostics.push({
      level: "info",
      code: "EMPTY_GRAPH",
      message: "The graph contains no valid nodes.",
    });
  const indexes = buildAdjacencyIndexes(nodes, edges);
  const cycleGroups = detectCycleGroups(
    nodes.map((node) => node.id),
    edges,
  );
  for (const group of cycleGroups) {
    diagnostics.push({
      level: "warning",
      code: "CYCLE_DETECTED",
      nodeId: group[0] ?? "",
      message: `Cycle detected: ${group.join(", ")}.`,
    });
  }
  const graph: NormalizedLineageGraph = {
    schemaVersion: "1.0",
    nodes,
    edges,
    ...indexes,
    cycleGroups,
  };
  const orderedDiagnostics = sortDiagnostics(diagnostics);
  return orderedDiagnostics.some((diagnostic) => diagnostic.level === "error") &&
    options.validationMode === "strict"
    ? result(null, orderedDiagnostics)
    : result(graph, orderedDiagnostics);
}

function result(
  graph: NormalizedLineageGraph | null,
  diagnostics: readonly LineageDiagnostic[],
): NormalizeLineageGraphResult {
  const orderedDiagnostics = sortDiagnostics(diagnostics);
  return {
    graph,
    diagnostics: orderedDiagnostics,
    hasErrors: orderedDiagnostics.some((diagnostic) => diagnostic.level === "error"),
  };
}

function normalizeNode(
  candidate: unknown,
  diagnostics: LineageDiagnostic[],
): NormalizedLineageNode | null {
  if (!isPlainRecord(candidate)) {
    diagnostics.push(invalid("A node must be a plain object."));
    return null;
  }
  const id = normalizeString(candidate["id"]);
  const label = normalizeString(candidate["label"]);
  if (
    id === null ||
    label === null ||
    (candidate["type"] !== undefined && !isNodeType(candidate["type"])) ||
    (candidate["status"] !== undefined && !isNodeStatus(candidate["status"])) ||
    (candidate["metadata"] !== undefined && !isPlainRecord(candidate["metadata"]))
  ) {
    diagnostics.push(invalid("A node has invalid required or typed fields.", id ?? undefined));
    return null;
  }
  const node: NormalizedLineageNode = { id, label };
  copyOptionalString(candidate, node, "layer");
  copyOptionalString(candidate, node, "subtitle");
  if (candidate["type"] !== undefined) node.type = candidate["type"];
  if (candidate["status"] !== undefined) node.status = candidate["status"];
  if (candidate["metadata"] !== undefined) node.metadata = candidate["metadata"];
  return node;
}

function normalizeEdge(
  candidate: unknown,
  nodeById: ReadonlyMap<string, NormalizedLineageNode>,
  diagnostics: LineageDiagnostic[],
): NormalizedLineageEdge | null {
  if (!isPlainRecord(candidate)) {
    diagnostics.push(invalid("An edge must be a plain object."));
    diagnostics.push({
      level: "error",
      code: "MISSING_EDGE_SOURCE",
      message: "Edge source is missing or invalid.",
    });
    diagnostics.push({
      level: "error",
      code: "MISSING_EDGE_TARGET",
      message: "Edge target is missing or invalid.",
    });
    return null;
  }
  const source = normalizeString(candidate["source"]);
  const target = normalizeString(candidate["target"]);
  const edgeId = normalizeOptionalId(candidate["id"]);
  const hasInvalidField =
    edgeId === null ||
    (candidate["label"] !== undefined && typeof candidate["label"] !== "string") ||
    (candidate["type"] !== undefined && !isEdgeType(candidate["type"])) ||
    (candidate["metadata"] !== undefined && !isPlainRecord(candidate["metadata"]));
  if (edgeId === null)
    diagnostics.push(invalid("An edge id must be a non-empty string when provided."));
  if (hasInvalidField && edgeId !== null)
    diagnostics.push(invalid("An edge has invalid typed fields.", undefined, edgeId));
  const validSource = source !== null && nodeById.has(source);
  const validTarget = target !== null && nodeById.has(target);
  if (!validSource)
    diagnostics.push({
      level: "error",
      code: "MISSING_EDGE_SOURCE",
      message: "Edge source is missing, invalid, or does not reference a valid node.",
      ...(typeof edgeId === "string" ? { edgeId } : {}),
    });
  if (!validTarget)
    diagnostics.push({
      level: "error",
      code: "MISSING_EDGE_TARGET",
      message: "Edge target is missing, invalid, or does not reference a valid node.",
      ...(typeof edgeId === "string" ? { edgeId } : {}),
    });
  if (source === null || target === null || hasInvalidField || !validSource || !validTarget)
    return null;
  const type = (candidate["type"] ?? "lineage") as LineageEdgeType;
  const label = (candidate["label"] ?? "") as string;
  const edge: NormalizedLineageEdge = {
    source,
    target,
    type,
    label,
    key: edgeKey(source, target, type, label),
  };
  if (edgeId !== undefined) edge.id = edgeId;
  if (candidate["metadata"] !== undefined)
    edge.metadata = candidate["metadata"] as Record<string, unknown>;
  return edge;
}

function normalizeString(value: unknown): string | null {
  return isNonEmptyString(value) ? value.trim() : null;
}

function normalizeOptionalId(value: unknown): string | null | undefined {
  return value === undefined ? undefined : normalizeString(value);
}

function copyOptionalString(
  source: Record<string, unknown>,
  target: NormalizedLineageNode,
  key: "layer" | "subtitle",
): void {
  if (source[key] !== undefined && typeof source[key] === "string") target[key] = source[key];
}

function edgeKey(source: string, target: string, type: LineageEdgeType, label: string): string {
  return JSON.stringify([source, target, type, label]);
}

function compareNodes(left: NormalizedLineageNode, right: NormalizedLineageNode): number {
  return left.id.localeCompare(right.id);
}

function compareEdges(left: NormalizedLineageEdge, right: NormalizedLineageEdge): number {
  return (
    left.source.localeCompare(right.source) ||
    left.target.localeCompare(right.target) ||
    left.type.localeCompare(right.type) ||
    left.label.localeCompare(right.label) ||
    (left.id ?? "").localeCompare(right.id ?? "")
  );
}
