# Layout

Layout consumes the normalized graph, never DOM or browser APIs. It forms strongly connected components (SCCs) from the graph's stable cycle groups and singleton nodes, then deduplicates edges between SCCs to form a condensation DAG.

Weakly connected condensation components are laid out as independent blocks, sorted by their canonical minimum node key. Each block uses deterministic Kahn topological processing and longest-path ranks. Equal-rank components start in canonical-key order and run four fixed forward/backward barycentric sweeps for basic crossing reduction.

A cyclic SCC remains one DAG component; its member nodes are sorted by ID and placed as a same-rank mini-stack. Logical primary/cross coordinates are mapped to LR, RL, TB, and BT after ranking. Disconnected blocks are packed on the cross axis. Edges use direction-aware node-side anchors and cubic paths; same-rank and self-loop edges use stable curves.

The output is independent of input node and edge array order for ranks, layer order, coordinates, block order, SCC member placement, paths, and bounds. Node dimensions are fixed. The implementation does not measure text, avoid obstacles, insert dummy nodes for long edges, use full orthogonal routing, or guarantee minimum crossings. Large-graph optimization is a later phase.
