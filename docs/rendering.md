# Rendering

Phase 3 renders a `NormalizedLineageGraph` into an isolated SVG owned by each `<lineage-viewer>` Shadow DOM. The renderer creates its own unique, deterministic marker ID and writes user-provided labels with `textContent`; it does not use HTML parsing APIs or execute metadata.

`createBasicRenderScene()` is deliberately internal. This is a provisional Phase 3 placement strategy. It is not the deterministic layered layout: it simply arranges normalized nodes in stable order horizontally or vertically for `LR`, `RL`, `TB`, and `BT` previews. Phase 4 will replace this scene-generation layer with deterministic DAG layout while reusing the renderer's scene input.

Edges are straight SVG paths. Self loops are included only when `showSelfLoops` is enabled during Phase 2 normalization. There is no collision avoidance, routing, zoom, panning, fit view, or node interaction in this phase.
