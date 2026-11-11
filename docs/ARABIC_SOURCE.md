# Arabic corpus: QPC Hafs

The reader ships the **QPC Hafs (KFGQPC)** ayah text from Qur'anpedia's
`mushafs-2` dump, version **2026-09-30**. It contains all 6,236 Hafs ayat with
stable `surah:ayah` identifiers. The importer preserves every Arabic string
verbatim and records the SHA-256 of the downloaded source file.

Qur'anpedia's data license permits use in apps and websites. Because this
project republishes a dataset, the required source credit, link, and dump
version are shown in the application and committed corpus metadata. See the
[license](https://api.quranpedia.net/dumps/LICENSE.md) and source
[dump](https://api.quranpedia.net/dumps/mushafs-2.json.gz). Check the provider's
changes feed before publishing a later revision.

The opening Bismillah is interface metadata, displayed before each surah except
At-Tawbah (9). It is intentionally not assigned an ayah number. QPC Hafs ayah
records therefore begin with the numbered ayah text (for example, 2:1 is
`الٓمٓ`).
