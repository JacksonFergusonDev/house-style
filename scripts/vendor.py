# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Vendors a house-style release into a site that can't install it with npm.

A documentation site such as Zensical serves only files under its docs folder,
so it copies one tagged release there and commits it. Run this script from the
same tag it vendors, so the rules for copying a release come from that release:

    uv run https://raw.githubusercontent.com/JacksonFergusonDev/house-style/v1.5.0/scripts/vendor.py --tag v1.5.0 docs/house

Add ``--check`` in CI to fail when the copy differs from the tag.
"""

from __future__ import annotations

import argparse
import io
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


def _vendored(path: PurePosixPath) -> bool:
    """Whether a file from the release belongs in a site."""
    if str(path) == "LICENSE" or str(path) in _RENAMES:
        return True
    if path.parts[0] == "css":
        return path.suffix == ".css"
    if path.parts[0] == "js":
        return path.suffix == ".js"
    if path.parts[0] == "icons":
        return path.suffix == ".svg"
    return path.parts[0] == "fonts" and path.suffix in {".woff2", ".txt"}


def fetch_archive(tag: str) -> bytes:
    """Downloads the release's source tarball, exiting if it can't."""
    url = ARCHIVE_URL.format(tag=tag)
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return bytes(response.read(_MAX_ARCHIVE_BYTES))
    except (urllib.error.URLError, TimeoutError) as error:
        print(f"Failed to fetch {url}: {error}", file=sys.stderr)
        sys.exit(1)


def release_files(archive: bytes, tag: str) -> dict[str, bytes]:
    """Maps each vendored path, relative to the destination, to its bytes.

    Args:
        archive: The release's source tarball.
        tag: The tag the tarball was downloaded for.

    Returns:
        The files to vendor, including a notice naming the tag.
    """
    files: dict[str, bytes] = {}
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as tar:
        for member in tar.getmembers():
            if not member.isfile():
                continue
            path = PurePosixPath(*PurePosixPath(member.name).parts[1:])
            if not path.parts or not _vendored(path):
                continue
            extracted = tar.extractfile(member)
            if extracted is None:
                continue
            files[_RENAMES.get(str(path), str(path))] = extracted.read()
    files["README.txt"] = (
        f"house-style {tag}, from {REPOSITORY}.\n"
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
    parser.add_argument("--tag", required=True, help="Release tag, such as v1.5.0.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if the destination differs from the release.",
    )
    args = parser.parse_args(argv)

    files = release_files(fetch_archive(args.tag), args.tag)
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
