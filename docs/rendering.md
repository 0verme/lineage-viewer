# Rendering

The renderer consumes a precomputed `RenderScene` and writes SVG into each component's isolated Shadow DOM. User labels are assigned with `textContent`; metadata is never parsed as HTML or executed.

Table nodes remain graph nodes. Fields render as internal rows through `FieldRenderer`, and node height grows from the header height plus 28px per visible field. Nodes without fields retain the legacy minimum height.

Column edges use field-row centers as anchors and direction-aware cubic SVG paths. Multiple mappings, fan-in/fan-out, same-layer connections, cycles, and self-loops use stable route offsets. Table edges continue to use node-level anchors.

Before layout, the view projection selects visible relations:

- `table`: field rows are removed from the render projection; column-only endpoints derive one table relation.
- `column`: only column edges participate in visible adjacency and layout.
- `mixed`: the complete normalized graph is rendered.

The SVG renderer updates selection and search attributes without rebuilding graph data. Internal attributes such as `data-selected`, `data-highlighted`, `data-search-match`, and dimming flags are implementation details, not public DOM API.

There is no obstacle avoidance, node dragging, editable connection routing, or virtualized field list.
