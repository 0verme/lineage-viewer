from __future__ import annotations

import unittest
from json import loads
from pathlib import Path
from tempfile import TemporaryDirectory

from lineage_viewer_adapter_openlineage import (
    OpenLineageAdapterError,
    openlineage_to_lineage,
)
from lineage_viewer_adapter_openlineage.cli import main


def sample_event() -> dict:
    return {
        "eventType": "COMPLETE",
        "eventTime": "2026-07-19T08:00:00Z",
        "producer": "https://example.test/lineage",
        "run": {"runId": "00000000-0000-7000-8000-000000000001"},
        "job": {"namespace": "analytics", "name": "build.order_summary"},
        "inputs": [
            {
                "namespace": "warehouse",
                "name": "public.orders",
                "facets": {
                    "schema": {
                        "fields": [
                            {"name": "user_id", "type": "bigint"},
                            {
                                "name": "amount",
                                "type": "decimal(18,2)",
                                "description": "Order value",
                            },
                        ]
                    }
                },
            }
        ],
        "outputs": [
            {
                "namespace": "warehouse",
                "name": "analytics.order_summary",
                "facets": {
                    "schema": {
                        "fields": [
                            {"name": "customer_id", "type": "bigint"},
                            {"name": "total_amount", "type": "decimal(18,2)"},
                        ]
                    },
                    "columnLineage": {
                        "fields": {
                            "customer_id": {
                                "inputFields": [
                                    {
                                        "namespace": "warehouse",
                                        "name": "public.orders",
                                        "field": "user_id",
                                        "transformations": [
                                            {
                                                "type": "DIRECT",
                                                "subtype": "IDENTITY",
                                            }
                                        ],
                                    }
                                ]
                            },
                            "total_amount": {
                                "inputFields": [
                                    {
                                        "namespace": "warehouse",
                                        "name": "public.orders",
                                        "field": "amount",
                                        "transformations": [
                                            {
                                                "type": "DIRECT",
                                                "subtype": "AGGREGATION",
                                                "description": "SUM(amount)",
                                            }
                                        ],
                                    }
                                ]
                            },
                        }
                    },
                },
            }
        ],
    }


class OpenLineageAdapterTests(unittest.TestCase):
    def test_converts_job_datasets_schema_and_column_lineage(self) -> None:
        graph = openlineage_to_lineage(sample_event())

        self.assertEqual(graph["schemaVersion"], "1.0")
        self.assertEqual(
            [node["id"] for node in graph["nodes"]],
            [
                "job:analytics:build.order_summary",
                "dataset:warehouse:public.orders",
                "dataset:warehouse:analytics.order_summary",
            ],
        )
        self.assertEqual(graph["nodes"][0]["type"], "job")
        self.assertEqual(
            graph["nodes"][1]["fields"][1],
            {
                "id": "amount",
                "dataType": "decimal(18,2)",
                "description": "Order value",
            },
        )
        self.assertEqual(
            [
                (edge["source"], edge["target"], edge.get("label"))
                for edge in graph["edges"][:2]
            ],
            [
                (
                    "dataset:warehouse:public.orders",
                    "job:analytics:build.order_summary",
                    "reads",
                ),
                (
                    "job:analytics:build.order_summary",
                    "dataset:warehouse:analytics.order_summary",
                    "writes",
                ),
            ],
        )
        self.assertEqual(graph["edges"][2]["transformType"], "rename")
        self.assertEqual(graph["edges"][3]["transformType"], "aggregate")
        self.assertEqual(graph["edges"][3]["expression"], "SUM(amount)")

    def test_adds_facet_fields_missing_from_schema(self) -> None:
        event = sample_event()
        event["inputs"][0].pop("facets")
        event["outputs"][0]["facets"].pop("schema")

        graph = openlineage_to_lineage(event)

        self.assertEqual(
            graph["nodes"][1]["fields"], [{"id": "user_id"}, {"id": "amount"}]
        )
        self.assertEqual(
            graph["nodes"][2]["fields"],
            [{"id": "customer_id"}, {"id": "total_amount"}],
        )

    def test_accepts_output_facets_and_unknown_transform(self) -> None:
        event = sample_event()
        output = event["outputs"][0]
        output["outputFacets"] = {
            "columnLineage": output["facets"].pop("columnLineage")
        }
        mapping = output["outputFacets"]["columnLineage"]["fields"]["customer_id"][
            "inputFields"
        ][0]
        mapping["transformations"] = []

        graph = openlineage_to_lineage(event)

        self.assertEqual(graph["edges"][2]["transformType"], "unknown")

    def test_reuses_dataset_present_as_input_and_output(self) -> None:
        event = sample_event()
        event["outputs"].append(event["inputs"][0])

        graph = openlineage_to_lineage(event)

        dataset = next(
            node
            for node in graph["nodes"]
            if node["id"] == "dataset:warehouse:public.orders"
        )
        self.assertEqual(
            dataset["metadata"]["openLineage"]["roles"], ["input", "output"]
        )

    def test_rejects_invalid_and_unknown_dataset_references(self) -> None:
        with self.assertRaisesRegex(OpenLineageAdapterError, "event.job"):
            openlineage_to_lineage({})
        with self.assertRaisesRegex(OpenLineageAdapterError, "at least one"):
            openlineage_to_lineage({"job": {"namespace": "analytics", "name": "empty"}})

        event = sample_event()
        mapping = event["outputs"][0]["facets"]["columnLineage"]["fields"][
            "customer_id"
        ]["inputFields"][0]
        mapping["name"] = "missing"
        with self.assertRaisesRegex(OpenLineageAdapterError, "not present"):
            openlineage_to_lineage(event)

    def test_cli_writes_viewer_json(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            input_path = root / "event.json"
            output_path = root / "graph.json"
            import json

            input_path.write_text(json.dumps(sample_event()), encoding="utf-8")
            result = main([str(input_path), "--output", str(output_path)])

            self.assertEqual(result, 0)
            graph = loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(graph["nodes"][0]["type"], "job")
            self.assertEqual(graph["edges"][2]["sourceField"], "user_id")


if __name__ == "__main__":
    unittest.main()
