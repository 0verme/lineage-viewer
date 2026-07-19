from __future__ import annotations

from collections import OrderedDict
from collections.abc import Mapping
from typing import Any


class OpenLineageAdapterError(ValueError):
    """Raised when an OpenLineage event cannot be converted safely."""


def openlineage_to_lineage(event: Mapping[str, Any]) -> dict[str, Any]:
    """Convert one OpenLineage RunEvent into lineage-viewer graph JSON."""
    root = _mapping(event, "event")
    job = _mapping(root.get("job"), "event.job")
    job_namespace = _required_text(job, "namespace", "event.job")
    job_name = _required_text(job, "name", "event.job")
    job_id = _entity_id("job", job_namespace, job_name)

    inputs = _dataset_list(root.get("inputs", []), "event.inputs")
    outputs = _dataset_list(root.get("outputs", []), "event.outputs")
    if not inputs and not outputs:
        raise OpenLineageAdapterError(
            "event must contain at least one input or output dataset."
        )

    datasets: OrderedDict[str, dict[str, Any]] = OrderedDict()
    input_ids = _add_datasets(datasets, inputs, "input")
    output_ids = _add_datasets(datasets, outputs, "output")

    nodes = [
        {
            "id": job_id,
            "label": job_name,
            "type": "job",
            "subtitle": job_namespace,
            "metadata": _job_metadata(root, job_namespace, job_name),
        }
    ]
    nodes.extend(dataset["node"] for dataset in datasets.values())

    edges: list[dict[str, Any]] = []
    for dataset_id in input_ids:
        edges.append(
            {
                "source": dataset_id,
                "target": job_id,
                "label": "reads",
                "type": "dependency",
            }
        )
    for dataset_id in output_ids:
        edges.append(
            {
                "source": job_id,
                "target": dataset_id,
                "label": "writes",
                "type": "dependency",
            }
        )
    for output in outputs:
        edges.extend(_column_edges(output, datasets))

    return {"schemaVersion": "1.0", "nodes": nodes, "edges": edges}


def _dataset_list(value: Any, path: str) -> list[Mapping[str, Any]]:
    if not isinstance(value, list):
        raise OpenLineageAdapterError(f"{path} must be an array.")
    return [
        _mapping(dataset, f"{path}[{index}]") for index, dataset in enumerate(value)
    ]


def _add_datasets(
    datasets: OrderedDict[str, dict[str, Any]],
    items: list[Mapping[str, Any]],
    role: str,
) -> list[str]:
    ids: list[str] = []
    for index, dataset in enumerate(items):
        path = f"event.{role}s[{index}]"
        namespace = _required_text(dataset, "namespace", path)
        name = _required_text(dataset, "name", path)
        dataset_id = _entity_id("dataset", namespace, name)
        ids.append(dataset_id)
        fields = _schema_fields(dataset, path)
        if dataset_id not in datasets:
            datasets[dataset_id] = {
                "node": {
                    "id": dataset_id,
                    "label": name,
                    "type": "dataset",
                    "subtitle": namespace,
                    "fields": fields,
                    "metadata": {
                        "openLineage": {
                            "namespace": namespace,
                            "name": name,
                            "roles": [role],
                        }
                    },
                },
                "field_ids": OrderedDict((field["id"], None) for field in fields),
            }
        else:
            entry = datasets[dataset_id]
            roles = entry["node"]["metadata"]["openLineage"]["roles"]
            if role not in roles:
                roles.append(role)
            _merge_fields(entry, fields)
    return ids


def _schema_fields(dataset: Mapping[str, Any], path: str) -> list[dict[str, str]]:
    facets = _optional_mapping(dataset.get("facets"), f"{path}.facets")
    schema = _optional_mapping(facets.get("schema"), f"{path}.facets.schema")
    raw_fields = schema.get("fields", [])
    if not isinstance(raw_fields, list):
        raise OpenLineageAdapterError(f"{path}.facets.schema.fields must be an array.")
    fields: list[dict[str, str]] = []
    seen: set[str] = set()
    for index, raw_field in enumerate(raw_fields):
        field_path = f"{path}.facets.schema.fields[{index}]"
        field = _mapping(raw_field, field_path)
        field_id = _required_text(field, "name", field_path)
        if field_id in seen:
            raise OpenLineageAdapterError(
                f"{path}.facets.schema contains duplicate field {field_id!r}."
            )
        seen.add(field_id)
        converted = {"id": field_id}
        field_type = field.get("type")
        description = field.get("description")
        if isinstance(field_type, str) and field_type.strip():
            converted["dataType"] = field_type.strip()
        if isinstance(description, str) and description.strip():
            converted["description"] = description.strip()
        fields.append(converted)
    return fields


def _column_edges(
    output: Mapping[str, Any],
    datasets: OrderedDict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    output_namespace = _required_text(output, "namespace", "output dataset")
    output_name = _required_text(output, "name", "output dataset")
    output_id = _entity_id("dataset", output_namespace, output_name)
    facets = _optional_mapping(output.get("facets"), "output dataset facets")
    output_facets = _optional_mapping(
        output.get("outputFacets"), "output dataset outputFacets"
    )
    lineage = facets.get("columnLineage", output_facets.get("columnLineage"))
    if lineage is None:
        return []
    lineage_facet = _mapping(lineage, "output columnLineage facet")
    raw_fields = lineage_facet.get("fields", {})
    if not isinstance(raw_fields, Mapping):
        raise OpenLineageAdapterError("columnLineage.fields must be an object.")

    edges: list[dict[str, Any]] = []
    for target_field, raw_lineage in raw_fields.items():
        if not isinstance(target_field, str) or not target_field.strip():
            raise OpenLineageAdapterError(
                "columnLineage.fields keys must be non-empty strings."
            )
        target_id = target_field.strip()
        _ensure_field(datasets[output_id], target_id)
        field_lineage = _mapping(raw_lineage, f"columnLineage.fields[{target_field!r}]")
        input_fields = field_lineage.get("inputFields", [])
        if not isinstance(input_fields, list):
            raise OpenLineageAdapterError(
                f"columnLineage field {target_id!r} inputFields must be an array."
            )
        for index, raw_input in enumerate(input_fields):
            input_path = f"columnLineage.fields[{target_field!r}].inputFields[{index}]"
            input_field = _mapping(raw_input, input_path)
            namespace = _required_text(input_field, "namespace", input_path)
            name = _required_text(input_field, "name", input_path)
            source_field = _required_text(input_field, "field", input_path)
            source_id = _entity_id("dataset", namespace, name)
            if source_id not in datasets:
                raise OpenLineageAdapterError(
                    f"{input_path} references dataset {namespace}/{name} "
                    "which is not present in event inputs or outputs."
                )
            _ensure_field(datasets[source_id], source_field)
            transformations = _transformations(input_field, input_path)
            transform_type = _transform_type(transformations, source_field, target_id)
            edge: dict[str, Any] = {
                "source": source_id,
                "target": output_id,
                "sourceField": source_field,
                "targetField": target_id,
                "label": transform_type,
                "transformType": transform_type,
                "metadata": {"openLineage": {"transformations": transformations}},
            }
            expression = _transformation_description(transformations)
            if expression:
                edge["expression"] = expression
            edges.append(edge)
    return edges


def _transformations(input_field: Mapping[str, Any], path: str) -> list[dict[str, Any]]:
    value = input_field.get("transformations", [])
    if not isinstance(value, list):
        raise OpenLineageAdapterError(f"{path}.transformations must be an array.")
    return [
        dict(_mapping(transformation, f"{path}.transformations[{index}]"))
        for index, transformation in enumerate(value)
    ]


def _transform_type(
    transformations: list[dict[str, Any]], source_field: str, target_field: str
) -> str:
    types = {
        str(transformation.get("type", "")).upper()
        for transformation in transformations
    }
    subtypes = {
        str(transformation.get("subtype", "")).upper()
        for transformation in transformations
    }
    if "AGGREGATION" in subtypes or "AGGREGATE" in subtypes:
        return "aggregate"
    if "TRANSFORMATION" in subtypes:
        return "transform"
    if "INDIRECT" in types:
        return "unknown"
    if "IDENTITY" in subtypes or "DIRECT" in types:
        return "passthrough" if source_field == target_field else "rename"
    return "unknown"


def _transformation_description(transformations: list[dict[str, Any]]) -> str:
    descriptions = [
        description.strip()
        for transformation in transformations
        if isinstance((description := transformation.get("description")), str)
        and description.strip()
    ]
    return "; ".join(dict.fromkeys(descriptions))


def _merge_fields(entry: dict[str, Any], fields: list[dict[str, str]]) -> None:
    for field in fields:
        if field["id"] not in entry["field_ids"]:
            entry["node"]["fields"].append(field)
            entry["field_ids"][field["id"]] = None


def _ensure_field(entry: dict[str, Any], field_id: str) -> None:
    if field_id not in entry["field_ids"]:
        entry["node"]["fields"].append({"id": field_id})
        entry["field_ids"][field_id] = None


def _job_metadata(
    event: Mapping[str, Any], namespace: str, name: str
) -> dict[str, Any]:
    openlineage: dict[str, Any] = {"namespace": namespace, "name": name}
    event_type = event.get("eventType")
    if isinstance(event_type, str) and event_type:
        openlineage["eventType"] = event_type
    run = event.get("run")
    if isinstance(run, Mapping):
        run_id = run.get("runId")
        if isinstance(run_id, str) and run_id:
            openlineage["runId"] = run_id
    return {"openLineage": openlineage}


def _entity_id(kind: str, namespace: str, name: str) -> str:
    return f"{kind}:{namespace}:{name}"


def _required_text(value: Mapping[str, Any], key: str, path: str) -> str:
    result = value.get(key)
    if not isinstance(result, str) or not result.strip():
        raise OpenLineageAdapterError(f"{path}.{key} must be a non-empty string.")
    return result.strip()


def _mapping(value: Any, path: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise OpenLineageAdapterError(f"{path} must be an object.")
    return value


def _optional_mapping(value: Any, path: str) -> Mapping[str, Any]:
    if value is None:
        return {}
    return _mapping(value, path)
