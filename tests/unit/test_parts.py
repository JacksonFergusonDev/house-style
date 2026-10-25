"""Tests that parts.json describes this repository. Run with `python3 -m unittest discover -s tests/unit`."""

import fnmatch
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARTS = json.loads((ROOT / "parts.json").read_text())
# Everything a site uses; the rest (tests, scripts, tooling) stays here.
SHIPPED = ("css", "js", "fonts", "icons", "astro")


def _shipped() -> set[str]:
    files = {"LICENSE", "GUIDELINES.md"}
    for folder in SHIPPED:
        files |= {
            p.relative_to(ROOT).as_posix()
            for p in (ROOT / folder).rglob("*")
            if p.is_file() and p.suffix != ".ts"
        }
    return files


def _part_of(path: str) -> list[str]:
    return [
        name
        for name, part in PARTS.items()
        if any(fnmatch.fnmatchcase(path, pattern) for pattern in part["files"])
    ]


class PartsTests(unittest.TestCase):
    def test_every_shipped_file_is_in_exactly_one_part(self) -> None:
        for path in sorted(_shipped()):
            with self.subTest(path=path):
                self.assertEqual(len(_part_of(path)), 1, _part_of(path))

    def test_every_pattern_matches_a_file(self) -> None:
        shipped = _shipped()
        for name, part in PARTS.items():
            for pattern in part["files"]:
                with self.subTest(part=name, pattern=pattern):
                    self.assertTrue(fnmatch.filter(shipped, pattern))

    def test_a_stylesheet_only_references_files_its_part_ships(self) -> None:
        for sheet in sorted((ROOT / "css").glob("*.css")):
            path = sheet.relative_to(ROOT).as_posix()
            (part,) = _part_of(path)
            for url in re.findall(r"url\\('\\.\\./([^']+)'\\)", sheet.read_text()):
                with self.subTest(stylesheet=path, url=url):
                    self.assertIn(_part_of(url)[0], {"core", part})


if __name__ == "__main__":
    unittest.main()
