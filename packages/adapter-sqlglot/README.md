# lineage-viewer SQLGlot adapter

This independent Python adapter converts one SQL `SELECT` statement into JSON accepted by
`lineage-viewer`. SQL parsing stays outside the viewer's browser runtime.

## Install

```sh
python -m pip install -e packages/adapter-sqlglot
```

## Python API

```python
from lineage_viewer_adapter_sqlglot import sql_to_lineage

graph = sql_to_lineage(
    """
    SELECT user_id, SUM(amount) AS total_amount
    FROM orders
    GROUP BY user_id
    """,
    target_table="order_summary",
)
```

## CLI

```sh
lineage-viewer-sqlglot query.sql --target order_summary --output graph.json
```

The first release supports projected columns, table aliases, joins with qualified projected
columns, column aliases, scalar transformations, and aggregate functions. Wildcard expansion and
ambiguous unqualified columns across multiple tables are rejected rather than guessed. CTE output
resolution and correlated subqueries remain outside the supported P2 scope.
