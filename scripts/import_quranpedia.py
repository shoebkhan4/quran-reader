#!/usr/bin/env python3
"""Create the public, ayah-indexed QPC Hafs corpus from a verified source dump.

The Arabic strings are copied without normalisation or alteration.  The output
also carries the source licence, dump version, and source checksum required by
Qur'anpedia for redistributed datasets.
"""
import argparse
import hashlib
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
METADATA = json.loads((ROOT / "data/surahs.json").read_text(encoding="utf-8"))
EXPECTED = {f"{surah['id']}:{ayah}" for surah in METADATA for ayah in range(1, surah["verses"] + 1)}


def build(source: pathlib.Path) -> dict:
    raw = source.read_bytes()
    document = json.loads(raw)
    verses = []
    for surah in METADATA:
        chapter = document.get(str(surah["id"]))
        if not isinstance(chapter, list):
            raise ValueError(f"Missing chapter {surah['id']}")
        for record in chapter:
            number = record.get("verse")
            text = record.get("text")
            if record.get("chapter") != surah["id"] or not isinstance(number, int) or not isinstance(text, str) or not text:
                raise ValueError(f"Invalid Arabic record in chapter {surah['id']}: {record!r}")
            verses.append({"id": f"{surah['id']}:{number}", "surah": surah["id"], "ayah": number, "arabic": text})
    ids = [verse["id"] for verse in verses]
    if len(ids) != 6236 or set(ids) != EXPECTED or len(set(ids)) != len(ids):
        raise ValueError("Expected exactly 6,236 unique, continuous Hafs ayah IDs")
    return {
        "source": {
            "name": "Qur'anpedia QPC Hafs (KFGQPC)",
            "url": "https://api.quranpedia.net/dumps/mushafs-2.json.gz",
            "license": "Qur'anpedia.net Data License: reuse in apps and websites is permitted; redistributed datasets must credit Qur'anpedia.net with a link and state the dump version.",
            "license_url": "https://api.quranpedia.net/dumps/LICENSE.md",
            "dump_version": "2026-09-30",
            "source_sha256": hashlib.sha256(raw).hexdigest(),
            "retrieved_at": "2026-11-11"
        },
        "verses": verses
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=pathlib.Path)
    parser.add_argument("--output", type=pathlib.Path, default=ROOT / "data/quran-qpc-hafs.json")
    args = parser.parse_args()
    corpus = build(args.source)
    args.output.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {len(corpus['verses'])} ayat into {args.output}")
