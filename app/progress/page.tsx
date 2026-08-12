import Chrome from "@/components/Chrome";
import { getSectionStats, getSessions, getSkillStats } from "@/lib/data";
import { scaledScore, totalScore } from "@/lib/scoring";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

const NAMES: [Section, string][] = [
  ["listening", "Section 1 — Listening"],
  ["structure", "Section 2 — Structure & Written Expression"],
  ["reading", "Section 3 — Reading"],
];

export default async function Progress() {
  const [stats, skills, sessions] = await Promise.all([
    getSectionStats(),
    getSkillStats(),
    getSessions(15),
  ]);
  const total = totalScore(stats);

  if (!total) {
    return (
      <>
        <Chrome tab="progress" score={null} sub="Belum cukup data" />
        <div className="card">
          <p style={{ margin: 0 }}>
            Estimasi skor muncul setelah sekitar 25 soal terjawab. Tes diagnostik cukup untuk memunculkannya.
          </p>
          <a className="btn" href="/session/diagnostik">Mulai diagnostik</a>
        </div>
      </>
    );
  }

  const weak = [...skills].sort((a, b) => a.accuracy - b.accuracy).slice(0, 7);
  const strong = [...skills].sort((a, b) => b.accuracy - a.accuracy).slice(0, 4);

  return (
    <>
      <Chrome
        tab="progress"
        score={total.score}
        sub={total.provisional ? `Estimasi awal · ${total.answered} soal` : `${total.answered} soal terjawab`}
      />

      <div className="card">
        <div className="eyebrow">Estimasi skor ITP</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 46, fontWeight: 600, color: "var(--ink)", lineHeight: 1, margin: "8px 0 4px" }}>
          {total.score}
        </div>
        <p className="note">
          Rentang ITP 310–677. Diturunkan dari akurasi kumulatif Anda dengan kurva konversi perkiraan, bukan
          tabel resmi ETS.
        </p>
        <p className="note" style={{ marginTop: 10, color: "var(--scarlet)" }}>
          Angka ini cenderung <strong>lebih tinggi</strong> dari hasil tes sesungguhnya. Sesi Listening di sini
          berbasis skrip yang bisa dibaca ulang tanpa batas waktu, sedangkan di tes asli audionya berjalan sekali.
          Perlakukan Section 2 sebagai patokan yang paling jujur — formatnya identik dengan tes asli.
        </p>
      </div>

      <h2 className="sec">Skor per section</h2>
      <div className="card">
        {NAMES.map(([key, label]) => {
          const s = stats.find((x) => x.section === key);
          const answered = s?.answered ?? 0;
          const acc = answered ? (s!.correct / answered) : null;
          const pct = acc === null ? 0 : Math.round(acc * 100);
          const sc = scaledScore(key, acc);
          return (
            <div className="bar" key={key}>
              <div className="lab">
                {label}
                <br />
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                  {s?.correct ?? 0}/{answered} soal
                </span>
              </div>
              <div className="track">
                <div className={`fill ${pct < 55 ? "weak" : pct >= 75 ? "strong" : ""}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="pct">{sc ?? "—"}</div>
            </div>
          );
        })}
        <p className="note">
          Kolom kanan adalah skor terskala per section (rentang 31–68), bukan persentase. Section dengan kurang
          dari 40 soal terjawab belum stabil — selisih dua jawaban bisa menggeser angkanya beberapa poin.
        </p>
      </div>

      {weak.length > 0 && (
        <>
          <h2 className="sec">Skill terlemah</h2>
          <div className="card">
            {weak.map((s) => {
              const pct = Math.round(s.accuracy * 100);
              return (
                <div className="bar" key={s.skill}>
                  <div className="lab">
                    {s.skill}
                    <br />
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                      {s.correct}/{s.answered} soal{s.answered < 10 ? " · sampel kecil" : ""}
                    </span>
                  </div>
                  <div className="track">
                    <div className={`fill ${pct < 55 ? "weak" : ""}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="pct">{pct}%</div>
                </div>
              );
            })}
            <p className="note">
              Hanya skill dengan minimal 5 soal terjawab yang ditampilkan. Yang bertanda &quot;sampel kecil&quot;
              belum layak dijadikan dasar keputusan — satu jawaban bisa menggeser persentasenya belasan poin.
              Tunggu sampai 10 soal sebelum mengalokasikan waktu belajar ke sana.
            </p>
          </div>

          <h2 className="sec">Sudah aman</h2>
          <div className="card tight">
            <table className="hist">
              <tbody>
                {strong.map((s) => (
                  <tr key={s.skill}>
                    <td>{s.skill}</td>
                    <td className="r">{Math.round(s.accuracy * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="sec">Riwayat sesi</h2>
      <div className="card tight">
        <table className="hist">
          <thead>
            <tr><th>Tanggal</th><th>Sesi</th><th className="r">Benar</th><th className="r">%</th></tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{String(s.started_at).slice(0, 10)}</td>
                <td>{s.slot}</td>
                <td className="r">{s.correct}/{s.total}</td>
                <td className="r">{s.total ? Math.round((s.correct / s.total) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}