"""Tests for scripts/vendor.py. Run with `python3 -m unittest discover -s tests/unit`."""

import contextlib
import io
import json
import sys
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

import vendor


def _archive(files: dict[str, bytes], root: str = "house-style-1.0.0") -> bytes:
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tar:
        for name, content in files.items():
            info = tarfile.TarInfo(f"{root}/{name}")
            info.size = len(content)
            tar.addfile(info, io.BytesIO(content))
    return buffer.getvalue()


PARTS = {
    "core": {
        "files": [
            "LICENSE",
            "GUIDELINES.md",
            "css/tokens.css",
            "fonts/README.md",
            "fonts/OFL.txt",
            "fonts/dm-sans.woff2",
            "icons/README.md",
            "icons/*.svg",
        ]
    },
    "docs": {"files": ["css/terminal.css", "js/cast.js", "fonts/symbols.woff2"]},
    "site": {"files": ["css/site.css", "js/field.js"]},
}

RELEASE = {
    "LICENSE": b"MIT",
    "README.md": b"# house-style",
    "package.json": b"{}",
    "parts.json": json.dumps(PARTS).encode(),
    "css/tokens.css": b":root {}",
    "css/terminal.css": b".hs-terminal {}",
    "css/site.css": b".hs-bar {}",
    "css/notes.txt": b"not a stylesheet",
    "js/cast.js": b"export {};",
    "js/cast.d.ts": b"export {};",
    "js/field.js": b"export {};",
    "fonts/dm-sans.woff2": b"font",
    "fonts/symbols.woff2": b"symbols",
    "fonts/OFL.txt": b"license",
    "fonts/README.md": b"# Fonts",
    "icons/arrow-right.svg": b"<svg/>",
    "icons/README.md": b"# Icons",
    "scripts/vendor.py": b"print()",
    "GUIDELINES.md": b"# Guidelines",
    "AGENTS.md": b"# Agents",
}

CORE_FILES = {
    "LICENSE",
    "README.txt",
    "css/tokens.css",
    "fonts/dm-sans.woff2",
    "fonts/OFL.txt",
    "fonts/README.txt",
    "icons/arrow-right.svg",
    "icons/README.txt",
    "GUIDELINES.txt",
}


class VendorTests(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)

    def test_core_alone_is_what_every_site_serves(self) -> None:
        files = vendor.release_files(_archive(RELEASE), "v9.9.9", {"core"})

        self.assertEqual(set(files), CORE_FILES)
        self.assertEqual(files["fonts/README.txt"], b"# Fonts")
        self.assertEqual(files["GUIDELINES.txt"], b"# Guidelines")
        self.assertIn(b"house-style v9.9.9 (core)", files["README.txt"])

    def test_a_part_adds_its_files_to_core(self) -> None:
        files = vendor.release_files(_archive(RELEASE), "v9.9.9", {"docs"})

        self.assertEqual(
            set(files),
            CORE_FILES | {"css/terminal.css", "js/cast.js", "fonts/symbols.woff2"},
        )
        self.assertIn(b"(core, docs)", files["README.txt"])

    def test_an_unknown_part_is_refused(self) -> None:
        archive = _archive(RELEASE)
        err = io.StringIO()
        with (
            mock.patch.object(vendor, "fetch_archive", return_value=archive),
            contextlib.redirect_stderr(err),
            self.assertRaises(SystemExit) as raised,
        ):
            vendor.main([str(self.root), "--tag", "v1.0.0", "--parts", "astral"])

        self.assertEqual(raised.exception.code, 2)
        self.assertIn("Unknown part astral", err.getvalue())

    def test_write_files_leaves_exactly_the_release(self) -> None:
        (self.root / "css").mkdir()
        (self.root / "css" / "old.css").write_text("stale")
        (self.root / "gone").mkdir()
        (self.root / "gone" / "file.js").write_text("stale")
        files = vendor.release_files(_archive(RELEASE), "v9.9.9", {"site"})

        vendor.write_files(self.root, files)

        self.assertEqual(vendor.committed_files(self.root), files)
        self.assertFalse((self.root / "gone").exists())

    def test_check_fails_unless_the_copy_matches(self) -> None:
        archive = _archive(RELEASE)
        for edit in ("matches", "edited", "missing"):
            with self.subTest(edit=edit):
                destination = self.root / edit
                vendor.write_files(
                    destination, vendor.release_files(archive, "v1.0.0", {"docs"})
                )
                if edit == "edited":
                    (destination / "css" / "tokens.css").write_text(
                        ":root { --bg: red; }"
                    )
                elif edit == "missing":
                    (destination / "js" / "cast.js").unlink()
                out, err = io.StringIO(), io.StringIO()
                argv = [
                    str(destination),
                    "--tag",
                    "v1.0.0",
                    "--parts",
                    "docs",
                    "--check",
                ]
                with (
                    mock.patch.object(vendor, "fetch_archive", return_value=archive),
                    contextlib.redirect_stdout(out),
                    contextlib.redirect_stderr(err),
                ):
                    if edit == "matches":
                        vendor.main(argv)
                        self.assertIn("matches", out.getvalue())
                    else:
                        with self.assertRaises(SystemExit) as raised:
                            vendor.main(argv)
                        self.assertEqual(raised.exception.code, 1)
                        self.assertIn("without --check", err.getvalue())

    def test_vendoring_writes_the_release(self) -> None:
        archive = _archive(RELEASE)
        destination = self.root / "docs" / "house"
        with (
            mock.patch.object(vendor, "fetch_archive", return_value=archive),
            contextlib.redirect_stdout(io.StringIO()),
        ):
            vendor.main([str(destination), "--tag", "v1.0.0", "--parts", "docs,site"])

        self.assertEqual(
            vendor.committed_files(destination),
            vendor.release_files(archive, "v1.0.0", {"docs", "site"}),
        )


if __name__ == "__main__":
    unittest.main()
