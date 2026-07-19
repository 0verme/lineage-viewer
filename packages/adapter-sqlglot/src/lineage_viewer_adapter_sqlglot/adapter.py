from __future__ import annotations

from collections import OrderedDict
from typing import Any

from sqlglot import exp, parse_one
from sqlglot.errors import ParseError


class SqlGlotAdapterError(ValueError):
    """Raised when SQL cannot be converted without guessing its lineage."""


def sql_to_lineage(
    sql: str,
    *,
    target_table: str = "query_result",
    dialect: str | None = None,
) -> dict[str, Any]:
    """Convert one SELECT statement into lineage-viewer graph JSON."""
    if not sql.strip():
        raise SqlGlotAdapterError("SQL must not be empty.")
    target_id = target_table.strip()
    if not target_id:
        raise SqlGlotAdapterError("target_table must not be empty.")
    try:
        statement = parse_one(sql, read=dialect)
    except ParseError as error:
        raise SqlGlotAdapterError(
            f"SQLGlot could not parse the SQL: {error}"
        ) from error

    select = (
        statement if isinstance(statement, exp.Select) else statement.find(exp.Select)
    )
    if select is None:
        raise SqlGlotAdapterError("Only statements containing SELECT are supported.")

    tables = list(select.find_all(exp.Table))
    if not tables:
        raise SqlGlotAdapterError("SELECT must read from at least one table.")
    aliases: dict[str, str] = {}
    source_fields: OrderedDict[str, OrderedDict[str, None]] = OrderedDict()
    for table in tables:
        table_id = _table_id(table)
        source_fields.setdefault(table_id, OrderedDict())
        aliases[table.alias_or_name.casefold()] = table_id
        aliases[table.name.casefold()] = table_id
        aliases[table_id.casefold()] = table_id
    if target_id in source_fields:
        raise SqlGlotAdapterError(
            f"target_table {target_id!r} conflicts with a source table ID."
        )

    output_fields: list[dict[str, str]] = []
    edges: list[dict[str, str]] = []
    for index, projection in enumerate(select.expressions, start=1):
        if isinstance(projection, exp.Star) or projection.find(exp.Star) is not None:
            raise SqlGlotAdapterError(
                "Wildcard projections require schema expansion and are not supported."
            )
        expression = (
            projection.this if isinstance(projection, exp.Alias) else projection
        )
        output_id = _output_name(projection, expression, index)
        output_fields.append({"id": output_id})
        columns = list(expression.find_all(exp.Column))
        if isinstance(expression, exp.Column) and not columns:
            columns = [expression]
        transform_type = _transform_type(projection, expression, output_id)
        expression_sql = expression.sql(dialect=dialect)
        for column in columns:
            source_id = _resolve_source(column, aliases, source_fields)
            source_fields[source_id].setdefault(column.name, None)
            edges.append(
                {
                    "source": source_id,
                    "target": target_id,
                    "sourceField": column.name,
                    "targetField": output_id,
                    "label": transform_type,
                    "transformType": transform_type,
                    "expression": expression_sql,
                }
            )

    nodes = [
        {
            "id": table_id,
            "label": table_id,
            "type": "table",
            "fields": [{"id": field_id} for field_id in fields],
        }
        for table_id, fields in source_fields.items()
    ]
    nodes.append(
        {
            "id": target_id,
            "label": target_id,
            "type": "view",
            "fields": output_fields,
        }
    )
    return {"schemaVersion": "1.0", "nodes": nodes, "edges": edges}


def _table_id(table: exp.Table) -> str:
    parts = [part for part in (table.catalog, table.db, table.name) if part]
    return ".".join(parts)


def _output_name(
    projection: exp.Expression, expression: exp.Expression, index: int
) -> str:
    alias = projection.alias
    if alias:
        return alias
    if isinstance(expression, exp.Column):
        return expression.name
    output_name = projection.output_name
    return output_name or f"expression_{index}"


def _resolve_source(
    column: exp.Column,
    aliases: dict[str, str],
    source_fields: OrderedDict[str, OrderedDict[str, None]],
) -> str:
    qualifier = column.table
    if qualifier:
        source_id = aliases.get(qualifier.casefold())
        if source_id is None:
            raise SqlGlotAdapterError(
                f"Column {column.sql()} references unknown table or alias {qualifier!r}."
            )
        return source_id
    if len(source_fields) == 1:
        return next(iter(source_fields))
    raise SqlGlotAdapterError(
        f"Column {column.sql()} is ambiguous across multiple tables; qualify it with a table alias."
    )


def _transform_type(
    projection: exp.Expression,
    expression: exp.Expression,
    output_id: str,
) -> str:
    if expression.find(exp.AggFunc) is not None or isinstance(expression, exp.AggFunc):
        return "aggregate"
    if isinstance(expression, exp.Column):
        return "rename" if output_id != expression.name else "passthrough"
    return "transform"
