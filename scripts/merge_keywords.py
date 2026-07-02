#!/usr/bin/env python3
"""
merge_keywords.py

Cross-reference keywords exported from an iPhoto/Photos library (via osxphotos)
against the canonical taxonomy in docs/keywords.yml.

Usage:
    # 1. Export keywords from your library with osxphotos (run on macOS):
    #    pip install osxphotos
    #    osxphotos keywords --json --library "/path/to/Library.photoslibrary" \
    #        > docs/iphoto-keywords.json
    #
    #    osxphotos auto-detects iPhoto libraries too, so this also works on a
    #    .iphoto library bundle, not just Photos.app libraries.
    #
    # 2. Run this script:
    #    python3 scripts/merge_keywords.py docs/iphoto-keywords.json docs/keywords.yml

    Add --write-new to also emit a YAML snippet of keywords that aren't in the
    taxonomy yet (default: docs/new-keywords-found.yml), so you can copy the
    ones worth keeping into docs/keywords.yml by hand.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("Missing dependency: pip install pyyaml")


def load_iphoto_keywords(path: Path) -> dict[str, int]:
    """Load the {"keywords": {"Name": count, ...}} JSON osxphotos produces."""
    data = json.loads(path.read_text(encoding="utf-8"))
    keywords = data.get("keywords", data)  # tolerate a bare dict too
    if not isinstance(keywords, dict):
        sys.exit(f"Unexpected format in {path}: expected an object of keyword -> count")
    return keywords


def load_taxonomy(path: Path) -> dict:
    """Load docs/keywords.yml: {category: {canonical: [synonyms]}}"""
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return data


def normalize(s: str) -> str:
    return " ".join(s.strip().lower().split())


def build_lookup(taxonomy: dict) -> dict[str, tuple[str, str]]:
    """Map normalized(name) -> (canonical, category) for canonical names and synonyms."""
    lookup: dict[str, tuple[str, str]] = {}
    for category, entries in taxonomy.items():
        if not isinstance(entries, dict):
            continue
        for canonical, synonyms in entries.items():
            lookup[normalize(canonical)] = (canonical, category)
            for syn in synonyms or []:
                lookup[normalize(syn)] = (canonical, category)
    return lookup


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("iphoto_json", type=Path, help="Path to osxphotos `keywords --json` output")
    parser.add_argument("taxonomy_yml", type=Path, help="Path to docs/keywords.yml")
    parser.add_argument(
        "--write-new",
        nargs="?",
        const="docs/new-keywords-found.yml",
        default=None,
        metavar="PATH",
        help="Write unmatched keywords as a YAML snippet to PATH (default: docs/new-keywords-found.yml)",
    )
    args = parser.parse_args()

    iphoto_keywords = load_iphoto_keywords(args.iphoto_json)
    taxonomy = load_taxonomy(args.taxonomy_yml)
    lookup = build_lookup(taxonomy)

    matched: list[tuple[str, int, str, str]] = []  # raw, count, canonical, category
    unmatched: list[tuple[str, int]] = []

    for raw_keyword, count in iphoto_keywords.items():
        hit = lookup.get(normalize(raw_keyword))
        if hit:
            canonical, category = hit
            matched.append((raw_keyword, count, canonical, category))
        else:
            unmatched.append((raw_keyword, count))

    matched.sort(key=lambda row: (-row[1], row[0]))
    unmatched.sort(key=lambda row: (-row[1], row[0]))

    total = len(iphoto_keywords)
    print(f"iPhoto/Photos keywords found: {total}")
    print(f"Matched to taxonomy:          {len(matched)}")
    print(f"Not in taxonomy (new):        {len(unmatched)}")
    print()

    if matched:
        print("Matched (iPhoto keyword -> canonical [category], count):")
        for raw, count, canonical, category in matched:
            arrow = "" if normalize(raw) == normalize(canonical) else f" -> {canonical}"
            print(f"  {raw}{arrow}  [{category}]  ({count})")
        print()

    if unmatched:
        print("Not yet in docs/keywords.yml (candidates to add), by frequency:")
        for raw, count in unmatched:
            print(f"  {raw}  ({count})")
        print()

    if args.write_new:
        out_path = Path(args.write_new)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        snippet = {
            "unsorted": {raw: [] for raw, _count in unmatched}
        }
        header = (
            "# Keywords found in the iPhoto/Photos library export that are not yet\n"
            "# in docs/keywords.yml. Review, rename/merge as needed, then move each\n"
            "# entry into the right category in keywords.yml (or delete it).\n"
            f"# Generated from: {args.iphoto_json}\n\n"
        )
        out_path.write_text(
            header + yaml.dump(snippet, sort_keys=False, allow_unicode=True),
            encoding="utf-8",
        )
        print(f"Wrote {len(unmatched)} new keyword candidates to {out_path}")


if __name__ == "__main__":
    main()
