# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Checks Markdown prose against GUIDELINES.md's writing rules.

It flags the two rules a script can check: em dashes, and words that sell or
soften a claim instead of saying what happens. Run it from the tag a site uses,
on the files or folders that hold its hand-written Markdown:

    uv run https://raw.githubusercontent.com/JacksonFergusonDev/house-style/v3.1.0/scripts/check_voice.py README.md docs

Fenced code blocks are skipped, and so is a table cell holding only a dash,
which marks "not applicable". It exits 1 and lists each problem when it finds
any.
"""

from __future__ import annotations

import argparse
import re
import sys
from collections.abc import Iterable, Iterator
from pathlib import Path

# Words that sell or soften a step instead of saying what it does.
UNWANTED_WORDS = re.compile(
    r"\b(?:simply|seamless(?:ly)?|effortless(?:ly)?|powerful|leverag(?:e|es|ed|ing)"
    r"|blazing|robust)\b",
    re.IGNORECASE,
)

_FENCE = re.compile(r"^[ \t]*```.*?^[ \t]*```", re.DOTALL | re.MULTILINE)
_EMPTY_CELL = re.compile(r"\|\s*—\s*(?=\|)")


def prose(text: str) -> str:
    """Drops fenced blocks, leaving the text a reader reads as prose."""
    return _FENCE.sub("", text)


def problems(text: str, name: str) -> Iterator[str]:
    """Yields each place `text` breaks a writing rule, labelled with `name`."""
    for line in prose(text).splitlines():
        if line.lstrip().startswith("|"):
            line = _EMPTY_CELL.sub("|", line)
        quoted = repr(line.strip()[:60])
        if "—" in line:
            yield (
                f"{name}: an em dash in {quoted}. "
                "Use a comma, a colon, or a new sentence"
            )
        for word in UNWANTED_WORDS.findall(line):
            yield f"{name}: {word!r} in {quoted}. Say what actually happens instead"


def markdown_files(paths: Iterable[Path]) -> list[Path]:
    """Expands folders into the Markdown files under them."""
    found: list[Path] = []
    for path in paths:
        found.extend(sorted(path.rglob("*.md")) if path.is_dir() else [path])
    return found


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("paths", nargs="+", type=Path, help="Markdown files or folders")
    args = parser.parse_args(argv)
    found = [
        problem
        for page in markdown_files(args.paths)
        for problem in problems(page.read_text(encoding="utf-8"), page.as_posix())
    ]
    for problem in found:
        print(problem, file=sys.stderr)
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
