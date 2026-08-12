export type Section = "listening" | "structure" | "reading";
export type Kind = "plain" | "we" | "reading" | "la" | "lg";
export type Slot = "pagi" | "siang" | "sore" | "diagnostik" | "ulang";

export type Passage = {
  id: string;
  kind: "reading" | "listening";
  title: string;
  body: string[] | null;
  script: [string, string][] | null;
};

export type Question = {
  id: string;
  section: Section;
  kind: Kind;
  skill: string;
  stem: string;
  opts: string[];
  ans: number;
  exp: string;
  passage_id: string | null;
  no_shuffle: boolean;
  script: [string, string][] | null;
  /** Satu penjelasan per pilihan, mengikuti urutan opts asli. */
  opt_exp: string[] | null;
  /** Taktik ujian atau jebakan yang sering muncul untuk pola ini. */
  tip: string | null;
};

/** Soal yang sudah diacak dan siap ditampilkan. */
export type DrillItem = Question & {
  shown: string[];   // urutan opsi yang tampil
  key: number;       // indeks jawaban benar dalam urutan tampil
  passage?: Passage;
};

export type SectionStat = {
  section: Section;
  answered: number;
  correct: number;
  accuracy: number;
};

export type SkillStat = {
  skill: string;
  section: Section;
  answered: number;
  correct: number;
  accuracy: number;
};