# Verse alignment review workflow

1. Obtain approved Arabic corpus and authorized Roman Urdu corpus.
2. Canonical key format: `surah:ayah` (e.g., `24:1`); never align by visual position or sequential array index.
3. Ingest content into candidate records with provenance: source URL, retrieval date, source element/text, hash, reviewer, status.
4. Mechanical checks: surah count 114; 6,236 Arabic verse IDs; 64 verses for An-Nur; unique, continuous and in-range IDs; nonempty content; record format; Arabic comparison against canonical text.
5. Translation checks: manually compare Roman Urdu candidates to authoritative Kanzul Iman Urdu and inspect neighbours for shifted/missing paragraphs. Long/short length alone is not an error.
6. If suspected mismatch, quarantine **affected IDs**. Require an explicit correction record (`original`, `corrected`, `reason`, `reviewer`, `date`, `source`). Never shift all later Ayat automatically.
7. Mark verse `verified` only after reviewed against original source, then independent second review for ambiguous cases.
8. Publishing gate: 0 missing/duplicate Arabic verses, 0 unreviewed translation pairings, correct attribution/licensing, responsive UI tests, and source integrity tests.

## Findings as of 11 Nov 2026

The inspected An-Nur page reports 64 Ayat. Its accessible text has verse marker `﴿1﴾` followed by Urdu, English, Hindi, Roman text and Tafseer, and similarly marker `﴿2﴾`. This confirms **the observed first two sequences**, not the DOM relationship of all 64 rows or the specific mismatch reported by the user. Browser-readable text alone cannot diagnose CSS overlap or hidden toggle behaviour. HTML candidate inspection and manual verification are still required.
