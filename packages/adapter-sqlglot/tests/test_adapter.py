from __future__ import annotations

import unittest
from json import loads
from tempfile import TemporaryDirectory
from pathlib import Path

from lineage_viewer_adapter_sqlglot import SqlGlotAdapterError, sql_to_lineage
from lineage_viewer_adapter_sqlglot.cli import main


class SqlGlotAdapterTests(unittest.TestCase):
    def test_select_alias_and_aggregate(self) -> None:
        graph = sql_to_lineage(
            """
            SELECT
              user_id,
              SUM(amount) AS total_amount
            FROM orders
            GROUP BY user_id
            """,
            target_table="order_summary",
        )

        self.assertEqual(graph["schemaVersion"], "1.0")
        self.assertEqual(
            graph["nodes"],
            [
                {
                    "id": "orders",
                    "label": "orders",
                    "type": "table",
                    "fields": [{"id": "user_id"}, {"id": "amount"}],
                },
                {
                    "id": "order_summary",
                    "label": "order_summary",
                    "type": "view",
                    "fields": [{"id": "user_id"}, {"id": "total_amount"}],
                },
            ],
        )
        self.assertEqual(
            graph["edges"],
            [
                {
                    "source": "orders",
                    "target": "order_summary",
                    "sourceField": "user_id",
                    "targetField": "user_id",
                    "label": "passthrough",
                    "transformType": "passthrough",
                    "expression": "user_id",
                },
                {
                    "source": "orders",
                    "target": "order_summary",
                    "sourceField": "amount",
                    "targetField": "total_amount",
                    "label": "aggregate",
                    "transformType": "aggregate",
                    "expression": "SUM(amount)",
                },
            ],
        )

    def test_join_table_aliases_and_scalar_transform(self) -> None:
        graph = sql_to_lineage(
            """
            SELECT
              o.order_id AS order_key,
              c.segment,
              o.amount * r.rate AS normalized_amount
            FROM orders AS o
            JOIN customers AS c ON c.id = o.customer_id
            JOIN exchange_rates AS r ON r.currency = o.currency
            """,
            target_table="enriched_orders",
        )

        self.assertEqual(
            [node["id"] for node in graph["nodes"]],
            ["orders", "customers", "exchange_rates", "enriched_orders"],
        )
        self.assertEqual(
            [
                (edge["source"], edge["sourceField"], edge["targetField"])
                for edge in graph["edges"]
            ],
            [
                ("orders", "order_id", "order_key"),
                ("customers", "segment", "segment"),
                ("orders", "amount", "normalized_amount"),
                ("exchange_rates", "rate", "normalized_amount"),
            ],
        )
        self.assertEqual(graph["edges"][0]["transformType"], "rename")
        self.assertEqual(graph["edges"][2]["transformType"], "transform")

    def test_rejects_ambiguous_unqualified_join_columns(self) -> None:
        with self.assertRaisesRegex(SqlGlotAdapterError, "ambiguous"):
            sql_to_lineage(
                "SELECT id FROM orders o JOIN customers c ON c.id = o.customer_id"
            )

    def test_rejects_wildcards_and_non_select_statements(self) -> None:
        with self.assertRaisesRegex(SqlGlotAdapterError, "Wildcard"):
            sql_to_lineage("SELECT * FROM orders")
        with self.assertRaisesRegex(SqlGlotAdapterError, "containing SELECT"):
            sql_to_lineage("DELETE FROM orders")
        with self.assertRaisesRegex(SqlGlotAdapterError, "conflicts"):
            sql_to_lineage("SELECT order_id FROM orders", target_table="orders")

    def test_cli_writes_viewer_json(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            input_path = root / "query.sql"
            output_path = root / "graph.json"
            input_path.write_text("SELECT order_id FROM orders", encoding="utf-8")

            result = main(
                [
                    str(input_path),
                    "--target",
                    "selected_orders",
                    "--output",
                    str(output_path),
                ]
            )

            self.assertEqual(result, 0)
            graph = loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(graph["nodes"][-1]["id"], "selected_orders")
            self.assertEqual(graph["edges"][0]["sourceField"], "order_id")


if __name__ == "__main__":
    unittest.main()
