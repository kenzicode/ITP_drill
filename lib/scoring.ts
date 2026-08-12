import type { Section, SectionStat } from "./types";

/**
 * Kurva konversi perkiraan akurasi → skor terskala ITP (31–68).
 * Ini APROKSIMASI, bukan tabel resmi ETS. Dipakai untuk melihat tren,
 * bukan untuk memprediksi hasil tes.
 */
const CURVE: Record<Section, [number, number][]> = {
  listening: [[0, 31], [0.2, 35], [0.4, 45], [0.6, 51], [0.8, 58], [1, 68]],
  structure: [[0, 31], [0.15, 36], [0.35, 45], [0.55, 51], [0.75, 58], [0.9, 63], [1, 68]],
  reading:   [[0, 31], [0.2, 34], [0.4, 44], [0.6, 50], [0.8, 57], [1, 67]],
};

export function scaledScore(section: Section, accuracy: number | null): number | null {
  if (accuracy === null || Number.isNaN(accuracy)) return null;
  const c = CURVE[section];
  for (let i = 1; i < c.length; i++) {
    if (accuracy <= c[i][0]) {
      const [x0, y0] = c[i - 1];
      const [x1, y1] = c[i];
      return Math.round(y0 + ((y1 - y0) * (accuracy - x0)) / (x1 - x0));
    }
  }
  return c[c.length - 1][1];
}

export const MIN_ANSWERS_FOR_ESTIMATE = 25;

export function totalScore(stats: SectionStat[]) {
  const answered = stats.reduce((a, s) => a + s.answered, 0);
  if (answered < MIN_ANSWERS_FOR_ESTIMATE) return null;
  const by = (s: Section) => stats.find((x) => x.section === s) ?? null;
  const parts = (["listening", "structure", "reading"] as Section[]).map((s) => {
    const st = by(s);
    return scaledScore(s, st && st.answered > 0 ? st.correct / st.answered : null) ?? 40;
  });
  return {
    score: Math.round(((parts[0] + parts[1] + parts[2]) * 10) / 3),
    parts,
    answered,
    provisional: answered < 150,
  };
}
