import Link from "next/link";
import Chrome from "@/components/Chrome";
import { createClient } from "@/lib/supabase/server";
import { getSectionStats, getSessions } from "@/lib/data";
import { totalScore } from "@/lib/scoring";

export const dynamic = "force-dynamic";

const SLOTS = [
  { k: "pagi", t: "Pagi", n: "Structure & Written Expression", m: "20 soal · tata bahasa · ±20 menit" },
  { k: "siang", t: "Siang", n: "Reading Comprehension", m: "20 soal · 3 bacaan · ±25 menit" },
  { k: "sore", t: "Sore", n: "Listening Comprehension", m: "20 soal · dialog & ceramah · ±20 menit" },
];

export default async function Home() {
  const supabase = createClient();
  const [stats, sessions] = await Promise.all([getSectionStats(), getSessions(5)]);
  const total = totalScore(stats);

  const { count: diagCount } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("slot", "diagnostik")
    .not("finished_at", "is", null);

  const { count: wrongCount } = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("is_correct", false);

  const today = new Date().toISOString().slice(0, 10);
  const doneToday = new Set(
    sessions.filter((s) => String(s.started_at).slice(0, 10) === today).map((s) => s.slot)
  );

  const sub = total
    ? total.provisional
      ? `Estimasi awal · ${total.answered} soal terjawab`
      : `Estimasi dari ${total.answered} soal`
    : "Selesaikan tes diagnostik untuk estimasi pertama";

  return (
    <>
      <Chrome tab="home" score={total?.score ?? null} sub={sub} />

      {!diagCount && (
        <div className="card" style={{ borderLeft: "4px solid var(--scarlet)" }}>
          <div className="eyebrow" style={{ color: "var(--scarlet)" }}>Langkah 1</div>
          <h3 style={{ fontFamily: "var(--disp)", fontSize: 20, color: "var(--ink)", margin: "5px 0 6px" }}>
            Tes diagnostik
          </h3>
          <p style={{ margin: 0, fontSize: 15.5 }}>
            30 soal campuran dari ketiga section. Hasilnya menetapkan titik awal Anda dan menentukan skill mana
            yang dikejar lebih dulu. Kerjakan sekali saja, tanpa jeda.
          </p>
          <Link className="btn" href="/session/diagnostik">Mulai diagnostik</Link>
        </div>
      )}

      <h2 className="sec">Sesi hari ini</h2>
      {SLOTS.map((s) => {
        const done = doneToday.has(s.k);
        return (
          <Link key={s.k} className="slot" href={`/session/${s.k}`} data-done={done ? "1" : "0"}>
            <div>
              <span className="time">{s.t}{done ? " · selesai" : ""}</span>
              <div className="name">{s.n}</div>
              <div className="meta">{s.m}</div>
            </div>
            <span className="go">{done ? "Ulangi →" : "Mulai →"}</span>
          </Link>
        );
      })}

      <h2 className="sec">Perbaikan</h2>
      <Link className="slot" href="/session/ulang">
        <div>
          <span className="time">Kapan saja</span>
          <div className="name">Ulang soal yang salah</div>
          <div className="meta">
            {wrongCount ? `${wrongCount} jawaban salah tercatat` : "Belum ada soal salah yang tersimpan"}
          </div>
        </div>
        <span className="go">Mulai →</span>
      </Link>

      {sessions.length > 0 && (
        <>
          <h2 className="sec">Lima sesi terakhir</h2>
          <div className="card tight">
            <table className="hist">
              <thead>
                <tr><th>Tanggal</th><th>Sesi</th><th className="r">Benar</th></tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{String(s.started_at).slice(0, 10)}</td>
                    <td>{s.slot}</td>
                    <td className="r">{s.correct}/{s.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
