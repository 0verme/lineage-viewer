# Interactions

The SVG scene lives inside a viewport group with a `translate(x y) scale(s)` transform. Wheel zoom is pointer-anchored, primary-button background dragging pans, and scale is clamped to 0.1–4. `fitView`, `fitBounds`, `fitNodes`, `resetView`, `focusNode`, `focusField`, and `zoomBy` provide programmatic viewport control.

## Node and field selection

Clicking a node emits `lineage-node-click`, selects it, and then emits `lineage-selection-change` when state changes. Clicking a field row takes precedence over its owning node, emits `lineage-field-click`, and selects `{ nodeId, fieldId }`. Clicking the background clears either selection.

Node selection uses table-level adjacency. Field selection uses an independent column-edge index and iterative breadth-first traversal. The visited set prevents cycles from causing repeated work or infinite traversal.

`highlightMode` supports:

- `upstream`: recursive incoming lineage
- `downstream`: recursive outgoing lineage
- `both`: both directions
- `connected`: compatibility alias for `both` on fields
- `none`: selection only

Related fields, edges, and owning nodes are highlighted; unrelated content is dimmed.

Clicking an edge emits `lineage-edge-click`. Its detail includes normalized source and target
locations plus `transformType` and `expression`, so applications can render transformation
details without looking the edge up again.

## Search

`search()` matches table/field IDs and labels without case sensitivity. A `dataType` filter is an exact case-insensitive field filter. Search highlighting is separate from selection, so searching does not discard the current selection.

`searchFields(keyword)` is the field-analysis shortcut: it matches field names, owning table
names, and data types, returns `{ nodeId, fieldId, label }`, and focuses the first result.

In `table` mode, a matching field highlights its owning table even though field rows are hidden. In `column` and `mixed` modes, matching rows are also marked. `clearSearch()` removes all search attributes and results.

There is no node drag, edge editing, multi-select, keyboard navigation, minimap, pinch zoom, or export.
