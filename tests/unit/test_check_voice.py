"""Tests for scripts/check_voice.py. Run with `python3 -m unittest discover -s tests/unit`."""

import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

import check_voice


def _problems(text: str) -> list[str]:
    return list(check_voice.problems(text, "page.md"))


class ProblemsTests(unittest.TestCase):
    def test_an_em_dash_is_flagged(self) -> None:
        (problem,) = _problems("It runs — then stops.\n")
        self.assertIn("page.md: an em dash", problem)

    def test_an_unwanted_word_is_flagged_in_any_case(self) -> None:
        self.assertEqual(len(_problems("Simply run it. It's ROBUST.\n")), 2)

    def test_a_word_containing_an_unwanted_one_is_not(self) -> None:
        self.assertEqual(_problems("Robustness tests.\n"), [])

    def test_fenced_code_is_skipped(self) -> None:
        self.assertEqual(_problems("```sh\necho simply — done\n```\n"), [])

    def test_a_dash_alone_in_a_table_cell_is_allowed(self) -> None:
        self.assertEqual(_problems("| Display | — | Hero |\n"), [])
        self.assertEqual(len(_problems("| Display | a — b | Hero |\n")), 1)


class MainTests(unittest.TestCase):
    def test_folders_expand_to_markdown_and_problems_fail(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "docs").mkdir()
            (root / "docs" / "good.md").write_text("Plain words.\n")
            (root / "docs" / "bad.md").write_text("A seamless step.\n")
            (root / "docs" / "notes.txt").write_text("A seamless step.\n")
            errors = io.StringIO()
            with contextlib.redirect_stderr(errors):
                code = check_voice.main([str(root / "docs")])
            self.assertEqual(code, 1)
            self.assertIn("bad.md: 'seamless'", errors.getvalue())
            self.assertNotIn("notes.txt", errors.getvalue())

    def test_clean_files_pass(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            page = Path(folder) / "README.md"
            page.write_text("It copies the files.\n")
            self.assertEqual(check_voice.main([str(page)]), 0)


if __name__ == "__main__":
    unittest.main()
