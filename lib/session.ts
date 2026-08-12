import type { DrillItem, Passage, Question, Slot } from "./types";

/** Fisher–Yates */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type QState = Record<string, { seen: number; wrong: number; last: number }>;

const seenOf = (st: QState, id: string) => st[id]?.seen ?? 0;
const lastOf = (st: QState, id: string) => st[id]?.last ?? 0;

/** Paling jarang dikerjakan lebih dulu, lalu yang paling lama tidak muncul. */
function freshest(list: Question[], st: QState, n: number): Question[] {
  return [...list]
    .sort((a, b) => seenOf(st, a.id) - seenOf(st, b.id) || lastOf(st, a.id) - lastOf(st, b.id))
    .slice(0, n);
}

function groupsByFreshness(qs: Question[], st: QState, passageIds: string[]): string[] {
  return [...passageIds].sort((a, b) => {
    const sum = (pid: string) =>
      qs.filter((q) => q.passage_id === pid).reduce((acc, q) => acc + seenOf(st, q.id), 0);
    return sum(a) - sum(b);
  });
}

/** Mengacak opsi sambil menjaga posisi jawaban benar. Written Expression tidak diacak. */
export function prepare(q: Question, passages: Map<string, Passage>): DrillItem {
  const passage = q.passage_id ? passages.get(q.passage_id) : undefined;
  if (q.no_shuffle) return { ...q, shown: q.opts, key: q.ans, passage };
  const order = shuffle(q.opts.map((_, i) => i));
  return { ...q, shown: order.map((i) => q.opts[i]), key: order.indexOf(q.ans), passage };
}

export function buildSession(
  slot: Slot,
  all: Question[],
  passages: Map<string, Passage>,
  st: QState
): DrillItem[] {
  const structure = all.filter((q) => q.kind === "plain");
  const we = all.filter((q) => q.kind === "we");
  const reading = all.filter((q) => q.kind === "reading");
  const la = all.filter((q) => q.kind === "la");
  const lg = all.filter((q) => q.kind === "lg");

  const readingPids = [...new Set(reading.map((q) => q.passage_id!))];
  const lgPids = [...new Set(lg.map((q) => q.passage_id!))];

  let picked: Question[] = [];

  if (slot === "pagi") {
    picked = shuffle([...freshest(structure, st, 9), ...freshest(we, st, 11)]);
  } else if (slot === "siang") {
    const order = groupsByFreshness(reading, st, readingPids).slice(0, 3);
    const take = [7, 7, 6];
    picked = order.flatMap((pid, i) =>
      freshest(reading.filter((q) => q.passage_id === pid), st, take[i] ?? 0)
    );
  } else if (slot === "sore") {
    const pid = groupsByFreshness(lg, st, lgPids)[0];
    picked = [...freshest(la, st, 14), ...lg.filter((q) => q.passage_id === pid)];
  } else if (slot === "diagnostik") {
    const rpid = groupsByFreshness(reading, st, readingPids)[0];
    const gpid = groupsByFreshness(lg, st, lgPids)[0];
    picked = [
      ...freshest(structure, st, 6),
      ...freshest(we, st, 6),
      ...reading.filter((q) => q.passage_id === rpid),
      ...lg.filter((q) => q.passage_id === gpid),
      ...freshest(la, st, 3),
    ];
  } else if (slot === "ulang") {
    picked = all
      .filter((q) => (st[q.id]?.wrong ?? 0) > 0)
      .sort((a, b) => (st[b.id]?.wrong ?? 0) - (st[a.id]?.wrong ?? 0))
      .slice(0, 20);
  }

  return picked.map((q) => prepare(q, passages));
}
