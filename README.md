# Quran Reader — Arabic + Roman Urdu Kanzul Iman

**Private proof of concept — Surah An-Nur (24).** This is a real Vite/React/TypeScript reader implementation with a searchable **114-Surah index**, an Ayat-level Arabic/Roman-Urdu layout, UI controls, bookmarking, and alignment-validation tooling.

## Important status

- ✅ All 114 Surah names and standard Ayat counts indexed (6,236 Ayat in total).
- ✅ An-Nur two-Ayat *source excerpt* preview for testing alignment **layout**.
- ✅ Exact `surah:ayah` identifiers, duplicate/missing-ID validation, unverified flags.
- ⚠️ Complete Arabic text not yet imported; see Tanzil import script.
- ⚠️ Complete Roman Urdu dataset not imported, and rights to redistribute it are unconfirmed.
- ⚠️ No translation misalignment has yet been conclusively diagnosed in the source HTML. Candidate extractor is deliberately conservative.
- ⚠️ This is not a verified Quran publication. Do not represent it as such.

## Run the web app

```bash
npm install
npm run dev
```
Open the printed local URL (typically http://localhost:5173). Requires Node.js 18+.

## Run validation tests

```bash
python -m unittest discover -s tests -v
python scripts/validate_alignment.py data/an-nur.sample.json
python scripts/validate_alignment.py data/an-nur.sample.json --complete
```
The final `--complete` command is **expected to fail**: 62 An-Nur verses are missing.

## Arabic corpus import

1. Download **Tanzil** Quran text from https://tanzil.net/download/ after reviewing its terms. Choose plain `surah|ayah|Arabic` format, preserving all marks. Do not modify the Arabic text.
2. Run `python scripts/import_tanzil.py /path/to/tanzil.txt`.
3. The importer rejects a corpus unless it has exactly 6,236 valid unique keys.
4. Merge source text with properly authorized Roman Urdu records by **exact ID**, not array position. The importer is separated intentionally until source rights/data are settled.
5. For any publication containing substantial Tanzil material include its required notice and link. See https://tanzil.net/docs/Text_License.

## Local HTML candidate investigation

With permission and subject to the website terms, use **Save page as HTML** in the browser, then:

```bash
pip install -r requirements.txt
python scripts/extract_source_candidates.py /path/to/an-nur.html --surah 24
```
It generates **unverified candidates** in ignored `private-data/`. The source may contain wrappers/footnotes/Tafseer causing misclassification. Do not silently fill missing translations by shifting later rows.

Compare each proposed pair to the canonical Arabic `24:n`, then review the corresponding Roman Urdu translation against the authorized Urdu Kanzul Iman reference. Record explicit reviewer decisions. Content needs human review; row counts alone don't establish semantic equivalence.

## GitHub

Create a **private** repository named `quran-reader-private`, then from this directory:

```bash
git init
git add .
git commit -m "Initial Quran reader PoC and alignment checks"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quran-reader-private.git
git push -u origin main
```

`.gitignore` excludes `private-data` and obvious complete Roman Urdu datasets. **A private repository still involves copying data to GitHub; do not upload unlicensed full translation datasets without authorization.**

## Source and rights notes

- Canonical Arabic planned: [Tanzil](https://tanzil.net) (CC BY 3.0 and additional text integrity/attribution conditions). Verbatim copies only.
- Roman Urdu *Kanzul Iman* source: [Alahazrat Network, Surah An-Nur](https://www.alahazratnetwork.org/surah/an-nur-%d8%a7%d9%84%d9%86%d9%88%d8%b1/). **No reusable dataset license verified.** Seek explicit written permission for extraction, storage, public display, and redistribution, including attribution, required corrections, and updates. Being public on the web does not mean permission to republish.
- Two excerpts provided solely for development/review of layout; remove them before public launch if permission is not established.

See `docs/ALIGNMENT.md` for the release gate, and `docs/PERMISSION_REQUEST.md` for a concise rights inquiry.

