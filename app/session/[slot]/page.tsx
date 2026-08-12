import { notFound } from "next/navigation";
import Drill from "@/components/Drill";
import { createClient } from "@/lib/supabase/server";
import { getBank, getQuestionState } from "@/lib/data";
import { buildSession } from "@/lib/session";
import type { Slot } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID: Slot[] = ["pagi", "siang", "sore", "diagnostik", "ulang"];

export default async function SessionPage({ params }: { params: { slot: string } }) {
  const slot = params.slot as Slot;
  if (!VALID.includes(slot)) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const [{ questions, passages }, state] = await Promise.all([getBank(), getQuestionState()]);
  const items = buildSession(slot, questions, passages, state);

  if (items.length === 0) {
    return (
      <div className="card" style={{ marginTop: 30 }}>
        <p style={{ margin: 0 }}>
          {slot === "ulang"
            ? "Belum ada soal yang pernah Anda jawab salah. Kerjakan satu sesi biasa lebih dulu."
            : "Bank soal untuk sesi ini masih kosong."}
        </p>
        <a className="btn" href="/">Kembali</a>
      </div>
    );
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, slot, total: items.length })
    .select("id")
    .single();

  if (error || !session) {
    return (
      <div className="card" style={{ marginTop: 30 }}>
        <p style={{ margin: 0 }}>Sesi gagal dibuat: {error?.message}. Muat ulang halaman.</p>
        <a className="btn" href="/">Kembali</a>
      </div>
    );
  }

  return <Drill items={items} slot={slot} sessionId={session.id} />;
}
