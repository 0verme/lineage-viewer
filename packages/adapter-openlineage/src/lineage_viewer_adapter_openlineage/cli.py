from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import TextIO

from .adapter import OpenLineageAdapterError, openlineage_to_lineage


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Convert an OpenLineage RunEvent to lineage-viewer JSON."
    )
    parser.add_argument("input", nargs="?", default="-", help="Event JSON file or -")
    parser.add_argument("--output", "-o", help="Output graph JSON file")
    args = parser.parse_args(argv)

    try:
        event = json.loads(_read_text(args.input))
        graph = openlineage_to_lineage(event)
    except (OSError, json.JSONDecodeError, OpenLineageAdapterError) as error:
        parser.error(str(error))

    content = json.dumps(graph, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        Path(args.output).write_text(content, encoding="utf-8")
    else:
        sys.stdout.write(content)
    return 0


def _read_text(path: str, stdin: TextIO | None = None) -> str:
    if path == "-":
        return (stdin or sys.stdin).read()
    return Path(path).read_text(encoding="utf-8")
