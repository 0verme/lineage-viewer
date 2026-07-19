from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Sequence

from .adapter import SqlGlotAdapterError, sql_to_lineage


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Convert SQL into lineage-viewer graph JSON with SQLGlot."
    )
    parser.add_argument(
        "input", nargs="?", default="-", help="SQL file, or - for standard input"
    )
    parser.add_argument(
        "--target", default="query_result", help="Target table or view ID"
    )
    parser.add_argument("--dialect", help="Optional SQLGlot source dialect")
    parser.add_argument(
        "--output", "-o", help="Output JSON file; defaults to standard output"
    )
    args = parser.parse_args(argv)
    sql = (
        sys.stdin.read()
        if args.input == "-"
        else Path(args.input).read_text(encoding="utf-8")
    )
    try:
        graph = sql_to_lineage(sql, target_table=args.target, dialect=args.dialect)
    except SqlGlotAdapterError as error:
        parser.exit(2, f"error: {error}\n")
    payload = json.dumps(graph, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        Path(args.output).write_text(payload, encoding="utf-8")
    else:
        sys.stdout.write(payload)
    return 0
