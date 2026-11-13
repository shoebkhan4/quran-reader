# Urdu and Roman Urdu review data

The Urdu records in `data/al-fatiha.translation.review.json`,
`data/al-baqarah.translation.review.json`, and
`data/ale-imran.translation.review.json` were extracted from the user-provided
`Surah 1.mhtml`, `Surah 2.mhtml`, and `Surah 3.mhtml` archives, saved from
<https://www.alahazratnetwork.org/surah/al-fatiha/> and
<https://www.alahazratnetwork.org/surah/al-baqarah/> and
<https://www.alahazratnetwork.org/surah/ale-imran/>. The project owner
confirmed the source is public domain on 12 November 2026.

`data/para-4.translation.review.json` through
`data/para-20.translation.review.json` were extracted from the supplied
Para 4–20 MHTML archives. Their ayah IDs are generated only after every source
row's Arabic marker matches the standard Para sequence. This captures complete
review coverage for Surahs An-Nisa through Al-Anfal, and partial coverage at
the surrounding surah boundaries.

For Al-Fatiha, the page's `q-roman-content` is deliberately excluded: it is
shifted by one row (for example, row `v1` contains the Bismillah Urdu text but
the Roman text for 1:2). The committed Roman Urdu is a review transliteration
generated from the aligned Urdu row. For Al-Baqarah and Ale-Imran, the source
Roman Urdu was present in the same matching row as its Urdu and Arabic marker.
Para 8 had two empty source Roman Urdu fields (6:164 and 6:165); their Roman
Urdu was generated from the aligned Urdu and is explicitly marked for extra
review. Later Para archives also contain empty Roman Urdu fields. Per the
project owner's instruction, those rows are now rendered through the committed
automatic Urdu-to-Roman fallback and marked **Auto-Romanized** in the reader.
All Roman Urdu must be reviewed before a full-corpus release.
