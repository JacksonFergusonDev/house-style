# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Vendors a house-style release into a site that can't install it with npm.

A documentation site such as Zensical serves only files under its docs folder,
so it copies one tagged release there and commits it. Run this script from the
same tag it vendors, so the rules for copying a release come from that release:

    uv run https://raw.githubusercontent.com/JacksonFergusonDev/house-style/v3.0.1/scripts/vendor.py --tag v3.0.1 --parts docs,site docs/house

A site copies only the parts it uses. ``parts.json`` in the release lists each
part's files; ``core`` (fonts, tokens, components, icons, and the guidelines)
always comes along. Add ``--check`` in CI to fail when the copy differs from
the tag.
"""

from __future__ import annotations

import argparse
import fnmatch
import io
import json
import sys
import tarfile
import urllib.error
import urllib.request
from pathlib import Path, PurePosixPath

REPOSITORY = "https://github.com/JacksonFergusonDev/house-style"
ARCHIVE_URL = (
    "https://codeload.github.com/JacksonFergusonDev/house-style/tar.gz/refs/tags/{tag}"
)
_MAX_ARCHIVE_BYTES = 10 * 1024 * 1024

# A Markdown file under a docs folder would build as a page, so these land as text.
_RENAMES = {
    "GUIDELINES.md": "GUIDELINES.txt",
    "fonts/README.md": "fonts/README.txt",
    "icons/README.md": "icons/README.txt",
}


CORE = "core"


class UnknownPartError(ValueError):
    """A requested part isn't in the release's ``parts.json``."""


def _patterns(manifest: dict[str, dict[str, object]], parts: set[str]) -> list[str]:
    """The file patterns of ``parts``, plus core's."""
    unknown = parts - set(manifest)
    if unknown:
        raise UnknownPartError(
            f"Unknown part {', '.join(sorted(unknown))}; "
            f"this release has {', '.join(manifest)}."
        )
    patterns: list[str] = []
    for name in [CORE, *sorted(parts - {CORE})]:
        files = manifest[name]["files"]
        assert isinstance(files, list)
        patterns.extend(str(f) for f in files)
    return patterns


def _wanted(path: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatchcase(path, pattern) for pattern in patterns)


def fetch_archive(tag: str) -> bytes:
    """Downloads the release's source tarball, exiting if it can't."""
    url = ARCHIVE_URL.format(tag=tag)
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return bytes(response.read(_MAX_ARCHIVE_BYTES))
    except (urllib.error.URLError, TimeoutError) as error:
        print(f"Failed to fetch {url}: {error}", file=sys.stderr)
        sys.exit(1)


def release_files(archive: bytes, tag: str, parts: set[str]) -> dict[str, bytes]:
    """Maps each vendored path, relative to the destination, to its bytes.

    Args:
        archive: The release's source tarball.
        tag: The tag the tarball was downloaded for.
        parts: The parts to copy, from the release's ``parts.json``; core
            always comes along.

    Returns:
        The files to vendor, including a notice naming the tag and parts.

    Raises:
        UnknownPartError: A part isn't in the release.
    """
    contents: dict[str, bytes] = {}
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as tar:
        for member in tar.getmembers():
            if not member.isfile():
                continue
            path = PurePosixPath(*PurePosixPath(member.name).parts[1:])
            extracted = tar.extractfile(member) if path.parts else None
            if extracted is not None:
                contents[str(path)] = extracted.read()
    manifest = json.loads(contents["parts.json"])
    patterns = _patterns(manifest, parts)
    files = {
        _RENAMES.get(path, path): content
        for path, content in contents.items()
        if _wanted(path, patterns)
    }
    chosen = ", ".join([CORE, *sorted(parts - {CORE})])
    files["README.txt"] = (
        f"house-style {tag} ({chosen}), from {REPOSITORY}.\n"
        "Vendored by its scripts/vendor.py. Move the site to another tag "
        "instead of editing these files.\n"
    ).encode()
    return files


def committed_files(directory: Path) -> dict[str, bytes]:
    """Maps each file under ``directory`` to its bytes."""
    if not directory.is_dir():
        return {}
    return {
        path.relative_to(directory).as_posix(): path.read_bytes()
        for path in sorted(directory.rglob("*"))
        if path.is_file()
    }


def write_files(directory: Path, files: dict[str, bytes]) -> None:
    """Makes ``directory`` hold exactly ``files``."""
    for stale in set(committed_files(directory)) - set(files):
        (directory / stale).unlink()
    for name, content in files.items():
        target = directory / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    for folder in sorted(directory.rglob("*"), reverse=True):
        if folder.is_dir() and not any(folder.iterdir()):
            folder.rmdir()


def main(argv: list[str] | None = None) -> None:
    """Vendors a release, or checks that the vendored copy matches it."""
    parser = argparse.ArgumentParser(description="Vendor a house-style release.")
    parser.add_argument("destination", type=Path, help="Folder to vendor into.")
    parser.add_argument("--tag", required=True, help="Release tag, such as v2.0.0.")
    parser.add_argument(
        "--parts",
        required=True,
        help="Comma-separated parts to copy besides core, such as docs,site; "
        "or core alone.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if the destination differs from the release.",
    )
    args = parser.parse_args(argv)

    parts = {part.strip() for part in args.parts.split(",") if part.strip()}
    try:
        files = release_files(fetch_archive(args.tag), args.tag, parts)
    except UnknownPartError as error:
        print(error, file=sys.stderr)
        sys.exit(2)
    if args.check:
        if committed_files(args.destination) != files:
            print(
                f"{args.destination} differs from house-style {args.tag}. "
                "Vendor it again without --check and commit the result.",
                file=sys.stderr,
            )
            sys.exit(1)
        print(f"{args.destination} matches house-style {args.tag}.")
        return

    write_files(args.destination, files)
    print(f"Vendored house-style {args.tag} into {args.destination}.")


if __name__ == "__main__":
    main()
