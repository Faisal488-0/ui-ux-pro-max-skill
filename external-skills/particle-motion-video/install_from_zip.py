#!/usr/bin/env python3
"""Safely install an original publisher ZIP into a Claude Code skills directory.

Does not download the archive, run third-party code or install dependencies.
"""
from __future__ import annotations

import argparse
from pathlib import Path, PurePosixPath
import shutil
import stat
import tempfile
import zipfile

MAX_FILES = 300
MAX_TOTAL_BYTES = 25 * 1024 * 1024
MAX_FILE_BYTES = 10 * 1024 * 1024
SKILL_NAME = "particle-motion-video"


def norm(filename: str) -> PurePosixPath:
    value = filename.replace("\\", "/")
    path = PurePosixPath(value)
    if not value or path.is_absolute() or any(
        p in (".", "..") for p in value.split("/")
    ):
        raise ValueError(f"Unsafe path in archive: {filename!r}")
    if ":" in path.parts[0] or "\x00" in value:
        raise ValueError(f"Unsafe path in archive: {filename!r}")
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip_path", type=Path, help="Original ZIP from the author")
    parser.add_argument(
        "--skills-dir", type=Path,
        default=Path.home() / ".claude" / "skills",
        help="Destination skills directory (default ~/.claude/skills)"
    )
    args = parser.parse_args()
    dest_dir = args.skills_dir.expanduser().resolve()
    target = dest_dir / SKILL_NAME

    if target.exists():
        parser.error(f"Destination exists; refusing to overwrite: {target}")
    if not zipfile.is_zipfile(args.zip_path):
        parser.error("Not a readable ZIP archive")

    with zipfile.ZipFile(args.zip_path) as bundle:
        entries = [info for info in bundle.infolist() if not info.is_dir()]
        if not entries or len(entries) > MAX_FILES:
            parser.error("Archive empty or too many files")
        files: dict[str, zipfile.ZipInfo] = {}
        total = 0
        for info in entries:
            try:
                path = norm(info.filename)
            except ValueError as error:
                parser.error(str(error))
            mode = info.external_attr >> 16
            if stat.S_ISLNK(mode):
                parser.error(f"Symlink is not permitted: {info.filename}")
            if info.file_size > MAX_FILE_BYTES:
                parser.error(f"Oversized member: {info.filename}")
            total += info.file_size
            if total > MAX_TOTAL_BYTES:
                parser.error("Excessive extracted size")
            name = path.as_posix()
            if name in files:
                parser.error(f"Duplicate archive path: {name}")
            files[name] = info

        candidates = []
        for name in files:
            path = PurePosixPath(name)
            if path.name == "SKILL.md":
                prefix = path.parent
                if (prefix / "scripts" / "render.py").as_posix() in files:
                    candidates.append(prefix)
        if len(candidates) != 1:
            parser.error("Expected one SKILL.md with scripts/render.py")
        root = candidates[0]

        dest_dir.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="particle-skill-", dir=dest_dir) as temp:
            stage = Path(temp) / SKILL_NAME
            stage.mkdir()
            for name, info in files.items():
                try:
                    relative = PurePosixPath(name).relative_to(root)
                except ValueError:
                    continue
                if not relative.parts:
                    continue
                output = stage.joinpath(*relative.parts)
                output.parent.mkdir(parents=True, exist_ok=True)
                with bundle.open(info) as source, output.open("wb") as sink:
                    shutil.copyfileobj(source, sink)
            if not (stage / "SKILL.md").is_file() or not (
                stage / "scripts" / "render.py"
            ).is_file():
                parser.error("Missing extracted skill files")
            stage.rename(target)

    print(f"Skill files copied to: {target}")
    print("No dependencies were installed and no vendor code was executed.")
    print("Review the scripts and license before running the skill.")


if __name__ == "__main__":
    main()
