import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Menutup sesi dan menghitung ulang skornya dari tabel attempts. */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId wajib" }, { status: 400 });

  const { data: rows } = await supabase
    .from("attempts")
    .select("is_correct")
    .eq("session_id", sessionId);

  const total = rows?.length ?? 0;
  const correct = rows?.filter((r) => r.is_correct).length ?? 0;

  const { error } = await supabase
    .from("sessions")
    .update({ finished_at: new Date().toISOString(), correct, total })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, correct, total });
}
