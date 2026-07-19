# lineage-viewer OpenLineage adapter

This independent Python adapter converts an OpenLineage `RunEvent` into JSON accepted by
`lineage-viewer`. It has no runtime dependencies and does not add OpenLineage code to the
Web Component.

## Install

```sh
python -m pip install -e packages/adapter-openlineage
```

## Python API

```python
from lineage_viewer_adapter_openlineage import openlineage_to_lineage

graph = openlineage_to_lineage(event)
```

## CLI

```sh
lineage-viewer-openlineage event.json --output graph.json
```

The adapter renders input dataset to job and job to output dataset dependencies. Output dataset
`columnLineage` facets become direct field mappings from input datasets to output datasets.
Dataset `schema` facets supply field types and descriptions. Both standard `facets` and legacy or
producer-specific `outputFacets` placement are accepted for output column lineage.

The P3 scope handles one complete OpenLineage run event at a time. Event stream aggregation,
custom facet interpretation, nested schema-field flattening, and non-run event variants remain
outside this package.
