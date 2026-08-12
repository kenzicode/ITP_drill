import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Mencatat satu jawaban. Kebenaran ditentukan di server, bukan dikirim klien. */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { sessionId, questionId, picked, msTaken } = await request.json();
  if (typeof picked !== "number" || !questionId) {
    return NextResponse.json({ error: "payload tidak lengkap" }, { status: 400 });
  }

  const { data: q, error: qErr } = await supabase
    .from("questions")
    .select("id, ans")
    .eq("id", questionId)
    .single();
  if (qErr || !q) return NextResponse.json({ error: "soal tidak ditemukan" }, { status: 404 });

  const isCorrect = picked === q.ans;
  const { error } = await supabase.from("attempts").insert({
    user_id: user.id,
    session_id: sessionId ?? null,
    question_id: questionId,
    picked,
    is_correct: isCorrect,
    ms_taken: typeof msTaken === "number" ? msTaken : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, isCorrect });
}
