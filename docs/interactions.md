# Interactions

The SVG scene is placed inside a viewport group with a `translate(x y) scale(s)` transform. Mouse-wheel zoom is anchored at the pointer and primary-button pointer dragging pans the background. The scale is internally clamped to 0.1–4 with 24px fit padding.

`fitView()` fits immediately. A scene baseline is captured on scene creation: fitted with `fitOnLoad`, otherwise identity. `resetView()` restores that baseline; a manual fit does not replace it. ResizeObserver refits only before user pan, zoom, or focus. After interaction it retains scale and preserves the scene coordinate at the viewport center where possible.

Clicking a node emits `lineage-node-click`, then selects it and emits `lineage-selection-change` if selection changed. Clicking background clears selection; drag completion suppresses that click. Selection uses one ID only. Data updates retain a selected node when it remains in the graph and clear it when it does not.

`highlightMode` calculates state from normalized graph traversal: `upstream`, `downstream`, and `connected` highlight recursive related nodes and induced edges while dimming unrelated content. `none` displays only the selection state. There is no node drag, multi-select, keyboard navigation, search, minimap, pinch zoom, or export in this phase.
