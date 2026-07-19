# Product scope

## Positioning

> A lightweight, framework-free Web Component for interactive table-level and column-level data lineage visualization.

lineage-viewer receives standardized lineage nodes and edges, validates and normalizes them, computes stable layout, renders a lineage graph, and offers viewing, selection, highlighting, focus, and viewport capabilities through a standard Web Component API. Host applications receive interaction results through events.

The first implementation is not yet present. This document freezes the product boundary before implementation begins.

## In scope

- Standardized graph input and diagnostics.
- A native Web Component API that can be embedded in different host applications.
- Future stable layout, SVG rendering, and viewer interaction.

## Non-goals

- SQL parsing, automatic lineage extraction, database scanning, or scheduler collection.
- Metadata storage, identity, authorization, user login, or a data-governance platform.
- A general graph editor, node creation, or drag-to-connect editing.
- Replacing Apache Atlas or DataHub.

## Future product surfaces

### Demo Gallery

The future Demo Gallery will showcase prebuilt, typical lineage scenarios. It exists to demonstrate the viewer's visual and interaction capabilities; it is not an editor or data-management product.

### JSON Playground

The future JSON Playground will accept or import lineage JSON, validate it, show diagnostics, and provide an interactive graph preview. Its core output is the graph preview. SVG and PNG are separate export capabilities. It has no login, cloud persistence, collaboration, or project-management responsibility.
