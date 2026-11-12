# Al-Fatiha Urdu and Roman Urdu review sample

The Urdu records in `data/al-fatiha.translation.review.json`,
`data/al-baqarah.translation.review.json`, and
`data/ale-imran.translation.review.json` were extracted from the user-provided
`Surah 1.mhtml`, `Surah 2.mhtml`, and `Surah 3.mhtml` archives, saved from
<https://www.alahazratnetwork.org/surah/al-fatiha/> and
<https://www.alahazratnetwork.org/surah/al-baqarah/> and
<https://www.alahazratnetwork.org/surah/ale-imran/>. The project owner
confirmed the source is public domain on 12 November 2026.

For Al-Fatiha, the page's `q-roman-content` is deliberately excluded: it is
shifted by one row (for example, row `v1` contains the Bismillah Urdu text but
the Roman text for 1:2). The committed Roman Urdu is a review transliteration
generated from the aligned Urdu row. For Al-Baqarah and Ale-Imran, the source
Roman Urdu was present in the same matching row as its Urdu and Arabic marker.
All Roman Urdu must be reviewed before a full-corpus release.
