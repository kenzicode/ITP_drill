import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Membuat baris sesi. Dipanggil saat jawaban PERTAMA, bukan saat halaman dibuka,
 * supaya membuka atau memuat ulang halaman tidak meninggalkan sesi kosong.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { slot, total } = await request.json();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, slot, total: total ?? 0 })
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 });
  return NextResponse.json({ sessionId: data.id });
}