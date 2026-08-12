import { createClient } from "@/lib/supabase/server";
import type { Passage, Question, SectionStat, SkillNote, SkillStat } from "./types";
import type { QState } from "./session";

export async function getBank() {
  const supabase = createClient();
  const [{ data: questions }, { data: passages }] = await Promise.all([
    supabase.from("questions").select("*").eq("active", true),
    supabase.from("passages").select("*"),
  ]);
  const map = new Map<string, Passage>();
  (passages ?? []).forEach((p) => map.set(p.id, p as Passage));
  return { questions: (questions ?? []) as Question[], passages: map };
}

/** Rekap per soal milik user: berapa kali dikerjakan, berapa kali salah, kapan terakhir. */
export async function getSkillNotes(): Promise<Record<string, SkillNote>> {
  const supabase = createClient();
  const { data } = await supabase.from("skill_notes").select("*");
  const out: Record<string, SkillNote> = {};
  (data ?? []).forEach((n) => (out[n.skill] = n as SkillNote));
  return out;
}

export async function getQuestionState(): Promise<QState> {
  const supabase = createClient();
  const { data } = await supabase
    .from("attempts")
    .select("question_id, is_correct, answered_at")
    .order("answered_at", { ascending: true });

  const st: QState = {};
  (data ?? []).forEach((a) => {
    const row = (st[a.question_id] ??= { seen: 0, wrong: 0, last: 0 });
    row.seen += 1;
    row.last = new Date(a.answered_at).getTime();
    // wrong dihitung sebagai antrean: salah menambah, benar mengurangi sampai nol
    if (!a.is_correct) row.wrong += 1;
    else if (row.wrong > 0) row.wrong -= 1;
  });
  return st;
}

export async function getSectionStats(): Promise<SectionStat[]> {
  const supabase = createClient();
  const { data } = await supabase.from("v_section_stats").select("*");
  return (data ?? []) as SectionStat[];
}

export async function getSkillStats(): Promise<SkillStat[]> {
  const supabase = createClient();
  const { data } = await supabase.from("v_skill_stats").select("*").gte("answered", 5);
  return (data ?? []) as SkillStat[];
}

export async function getSessions(limit = 15) {
  const supabase = createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}