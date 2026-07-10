import type { LayoutInput, LayeredLayout, LayoutOptions, PositionedLayoutNode } from "./types.js";

const padding = 32;
const compare = (left: string, right: string): number => left.localeCompare(right);

interface Component {
  readonly key: string;
  readonly nodeIds: readonly string[];
  readonly cyclic: boolean;
  readonly incoming: Set<string>;
  readonly outgoing: Set<string>;
  rank: number;
}
interface Block {
  readonly components: readonly Component[];
  readonly key: string;
}

/** Pure, deterministic SCC-aware layered layout. */
export function layoutLineageGraph(input: LayoutInput, options: LayoutOptions): LayeredLayout {
  const components = createComponents(input);
  const byKey = new Map(components.map((component) => [component.key, component]));
  const nodeComponent = new Map<string, Component>();
  for (const component of components)
    for (const nodeId of component.nodeIds) nodeComponent.set(nodeId, component);
  for (const edge of input.edges) {
    const source = nodeComponent.get(edge.source);
    const target = nodeComponent.get(edge.target);
    if (source !== undefined && target !== undefined && source !== target) {
      source.outgoing.add(target.key);
      target.incoming.add(source.key);
    }
  }
  const blocks = createBlocks(components, byKey);
  const vertical = options.direction === "TB" || options.direction === "BT";
  const primaryNodeSize = vertical ? options.nodeHeight : options.nodeWidth;
  const crossNodeSize = vertical ? options.nodeWidth : options.nodeHeight;
  const blockGap = Math.max(options.nodeGap * 2, 64);
  const logical: Array<{
    id: string;
    primary: number;
    cross: number;
    rank: number;
    componentKey: string;
  }> = [];
  let crossOffset = 0;
  let totalPrimary = primaryNodeSize;
  for (const block of blocks) {
    const layers = rankAndOrder(block);
    const rankStarts: number[] = [];
    let primary = 0;
    for (let rank = 0; rank < layers.length; rank += 1) {
      rankStarts[rank] = primary;
      primary += primaryNodeSize + options.layerGap;
    }
    totalPrimary = Math.max(totalPrimary, Math.max(0, primary - options.layerGap));
    let blockCross = 0;
    for (const layer of layers) {
      let cross = 0;
      for (const component of layer) {
        const memberCount = component.nodeIds.length;
        const size = memberCount * crossNodeSize + Math.max(0, memberCount - 1) * options.nodeGap;
        for (let index = 0; index < memberCount; index += 1) {
          const id = component.nodeIds[index];
          if (id === undefined) continue;
          logical.push({
            id,
            primary: rankStarts[component.rank] ?? 0,
            cross: crossOffset + cross + index * (crossNodeSize + options.nodeGap),
            rank: component.rank,
            componentKey: component.key,
          });
        }
        cross += size + options.nodeGap;
      }
      blockCross = Math.max(blockCross, Math.max(0, cross - options.nodeGap));
    }
    crossOffset += blockCross + blockGap;
  }
  const totalCross = Math.max(crossNodeSize, Math.max(0, crossOffset - blockGap));
  const nodes: PositionedLayoutNode[] = logical
    .sort((left, right) => compare(left.id, right.id))
    .map((item) => mapDirection(item, options, totalPrimary));
  return {
    nodes,
    width: Math.max(1, (vertical ? totalCross : totalPrimary) + padding * 2),
    height: Math.max(1, (vertical ? totalPrimary : totalCross) + padding * 2),
  };
}

function createComponents(input: LayoutInput): Component[] {
  const grouped = input.cycleGroups.map((group) => [...group].sort(compare));
  const assigned = new Set(grouped.flat());
  for (const node of input.nodes) if (!assigned.has(node.id)) grouped.push([node.id]);
  return grouped
    .map((nodeIds) => ({
      key: nodeIds.join("\u0000"),
      nodeIds,
      cyclic:
        nodeIds.length > 1 ||
        input.edges.some((edge) => edge.source === nodeIds[0] && edge.target === nodeIds[0]),
      incoming: new Set<string>(),
      outgoing: new Set<string>(),
      rank: 0,
    }))
    .sort((left, right) => compare(left.key, right.key));
}

function createBlocks(
  components: readonly Component[],
  byKey: ReadonlyMap<string, Component>,
): Block[] {
  const visited = new Set<string>();
  const blocks: Block[] = [];
  for (const start of components) {
    if (visited.has(start.key)) continue;
    const pending = [start];
    const members: Component[] = [];
    visited.add(start.key);
    while (pending.length > 0) {
      const current = pending.pop();
      if (current === undefined) continue;
      members.push(current);
      for (const key of [...current.incoming, ...current.outgoing].sort(compare)) {
        const next = byKey.get(key);
        if (next !== undefined && !visited.has(key)) {
          visited.add(key);
          pending.push(next);
        }
      }
    }
    members.sort((left, right) => compare(left.key, right.key));
    blocks.push({ components: members, key: members[0]?.key ?? "" });
  }
  return blocks.sort((left, right) => compare(left.key, right.key));
}

function rankAndOrder(block: Block): Component[][] {
  const byKey = new Map(block.components.map((component) => [component.key, component]));
  const indegree = new Map(
    block.components.map((component) => [component.key, component.incoming.size]),
  );
  const ready = block.components
    .filter((component) => (indegree.get(component.key) ?? 0) === 0)
    .sort((a, b) => compare(a.key, b.key));
  const ordered: Component[] = [];
  while (ready.length > 0) {
    const current = ready.shift();
    if (current === undefined) continue;
    ordered.push(current);
    for (const key of [...current.outgoing].sort(compare)) {
      const value = (indegree.get(key) ?? 1) - 1;
      indegree.set(key, value);
      if (value === 0) {
        const target = byKey.get(key);
        if (target !== undefined) {
          ready.push(target);
          ready.sort((a, b) => compare(a.key, b.key));
        }
      }
    }
  }
  for (const component of ordered)
    component.rank = Math.max(
      0,
      ...[...component.incoming].map((key) => (byKey.get(key)?.rank ?? 0) + 1),
    );
  const layers: Component[][] = [];
  for (const component of ordered) (layers[component.rank] ??= []).push(component);
  for (const layer of layers) layer.sort((left, right) => compare(left.key, right.key));
  for (let sweep = 0; sweep < 4; sweep += 1) {
    const forward = sweep % 2 === 0;
    const indexes = new Map<string, number>();
    const range = forward ? [...layers.keys()] : [...layers.keys()].reverse();
    for (const index of range) {
      if ((forward && index === 0) || (!forward && index === layers.length - 1)) continue;
      const layer = layers[index] ?? [];
      const adjacent = layers[forward ? index - 1 : index + 1] ?? [];
      adjacent.forEach((component, position) => indexes.set(component.key, position));
      const original = new Map(layer.map((component, position) => [component.key, position]));
      layer.sort(
        (left, right) =>
          barycenter(left, indexes, forward) - barycenter(right, indexes, forward) ||
          (original.get(left.key) ?? 0) - (original.get(right.key) ?? 0) ||
          compare(left.key, right.key),
      );
    }
  }
  return layers;
}

function barycenter(
  component: Component,
  indexes: ReadonlyMap<string, number>,
  forward: boolean,
): number {
  const keys = [...(forward ? component.incoming : component.outgoing)].filter((key) =>
    indexes.has(key),
  );
  if (keys.length === 0) return Number.POSITIVE_INFINITY;
  return keys.reduce((sum, key) => sum + (indexes.get(key) ?? 0), 0) / keys.length;
}

function mapDirection(
  item: { id: string; primary: number; cross: number; rank: number; componentKey: string },
  options: LayoutOptions,
  totalPrimary: number,
): PositionedLayoutNode {
  const vertical = options.direction === "TB" || options.direction === "BT";
  const reverse = options.direction === "RL" || options.direction === "BT";
  const primarySize = vertical ? options.nodeHeight : options.nodeWidth;
  const primary = reverse ? totalPrimary - item.primary - primarySize : item.primary;
  return {
    id: item.id,
    x: padding + (vertical ? item.cross : primary),
    y: padding + (vertical ? primary : item.cross),
    width: options.nodeWidth,
    height: options.nodeHeight,
    rank: item.rank,
    componentKey: item.componentKey,
  };
}
