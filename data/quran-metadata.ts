/** Display metadata; verse records keep their original `surah:ayah` IDs. */
export const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

/** At-Tawbah is the sole surah without the opening Bismillah. */
export const hasOpeningBismillah = (surah: number) => surah !== 9;

/**
 * Fifteen commonly marked sajdah al-tilawah locations. Juristic treatment of
 * 22:77 and 38:24 differs; this is a display cue, not a prescribed ruling.
 * Confirm it against the selected licensed Arabic edition during corpus import.
 */
const SAJDAH_AYAT = new Set([
  '7:206', '13:15', '16:50', '17:109', '19:58', '22:18', '22:77', '25:60',
  '27:26', '32:15', '38:24', '41:38', '53:62', '84:21', '96:19',
]);

export const isSajdahAyah = (id: string) => SAJDAH_AYAT.has(id);

