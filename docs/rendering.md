# Rendering

The renderer consumes a precomputed `RenderScene` and renders it into an isolated SVG owned by each `<lineage-viewer>` Shadow DOM. It creates its own unique marker ID and writes user-provided labels with `textContent`; it does not use HTML parsing APIs or execute metadata.

`createLayeredRenderScene()` is internal. It consumes the pure TypeScript layout result and supplies node rectangles and complete edge path strings. The SVG renderer does not recalculate SCCs, ranks, coordinates, anchors, or routes.

Edges use direction-aware cubic paths. Same-rank SCC edges use deterministic outside curves; self loops are included only when `showSelfLoops` is enabled during Phase 2 normalization. A viewport group now applies `translate(x y) scale(s)` without relayout, and renderer interaction attributes (`data-selected`, `data-highlighted`, `data-dimmed`) update existing SVG nodes and edges. There is still no obstacle avoidance, node dragging, or edge editing.
