"use client";
import { useEffect, useRef, useState } from "react";
import type { DrillItem, Slot } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D"];
const LABEL: Record<Slot, string> = {
  pagi: "Sesi pagi · Structure",
  siang: "Sesi siang · Reading",
  sore: "Sesi sore · Listening",
  diagnostik: "Tes diagnostik",
  ulang: "Ulang soal salah",
};
const KIND_LABEL: Record<string, string> = {
  plain: "Structure",
  we: "Written Expression — pilih bagian yang salah",
  reading: "Reading Comprehension",
  la: "Listening Part A",
  lg: "Listening Part B/C",
};

export default function Drill({ items: initialItems, slot }: { items: DrillItem[]; slot: Slot }) {
  // Daftar soal dibekukan saat komponen dipasang. Kalau server component dimuat ulang,
  // opsi akan diacak ulang dan kunci jawabannya bergeser — state di bawah ini tidak boleh ikut bergeser.
  const [items] = useState<DrillItem[]>(initialItems);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => items.map(() => null));
  // Benar/salah disimpan saat menjawab, bukan dihitung ulang saat render.
  const [scored, setScored] = useState<(boolean | null)[]>(() => items.map(() => null));
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const shownAt = useRef(Date.now());
  const started = useRef(Date.now());

  const q = items[i];
  const answered = picked[i] !== null;
  const correct = scored.filter(Boolean).length;

  useEffect(() => {
    shownAt.current = Date.now();
  }, [i]);

  async function answer(choice: number) {
    if (picked[i] !== null || saving) return;
    const next = [...picked];
    next[i] = choice;
    setPicked(next);
    const marks = [...scored];
    marks[i] = choice === q.key;
    setScored(marks);
    setSaving(true);
    setFailed(false);
    try {
      let sid = sessionId;
      if (!sid) {
        const started = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, total: items.length }),
        });
        const j = await started.json();
        sid = j.sessionId ?? null;
        setSessionId(sid);
      }
      const res = await fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          questionId: q.id,
          // indeks dikembalikan ke urutan asli sebelum dikirim
          picked: q.opts.indexOf(q.shown[choice]),
          msTaken: Date.now() - shownAt.current,
        }),
      });
      if (!res.ok) setFailed(true);
    } catch {
      setFailed(true);
    }
    setSaving(false);
  }

  async function next() {
    if (i + 1 < items.length) {
      setI(i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (sessionId) {
      await fetch("/api/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
    setDone(true);
    // Tidak memanggil router.refresh() di sini: itu akan menyusun ulang daftar soal
    // di server dan membuat hasil sesi ini dihitung terhadap kunci yang sudah bergeser.
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (["1", "2", "3", "4"].includes(e.key) && picked[i] === null) answer(Number(e.key) - 1);
      else if (e.key === "Enter" && picked[i] !== null) next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const strip = (
    <div className="sheet">
      <div className="sheet-head">
        <span>{LABEL[slot]}</span>
        <span>
          {correct} benar · {Math.min(i + 1, items.length)}/{items.length}
        </span>
      </div>
      <div className="strip">
        {items.map((it, n) => {
          const p = picked[n];
          const cls = ["bub"];
          if (scored[n] !== null) cls.push(scored[n] ? "ok" : "no");
          if (n === i && !done) cls.push("cur");
          return (
            <div key={it.id} className={cls.join(" ")}>
              {n + 1}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (done) {
    const mins = Math.max(1, Math.round((Date.now() - started.current) / 60000));
    const bySkill: Record<string, { c: number; t: number }> = {};
    items.forEach((it, n) => {
      const b = (bySkill[it.skill] ??= { c: 0, t: 0 });
      b.t += 1;
      if (scored[n]) b.c += 1;
    });
    // Pemisahan yang tidak terlihat dari daftar skill: soal pendek versus teks panjang.
    const split = [
      { label: "Part A — dialog pendek", kinds: ["la"] },
      { label: "Part B/C — percakapan & ceramah", kinds: ["lg"] },
      { label: "Bacaan panjang", kinds: ["reading"] },
      { label: "Structure", kinds: ["plain"] },
      { label: "Written Expression", kinds: ["we"] },
    ]
      .map((g) => {
        const idx = items.map((it, n) => (g.kinds.includes(it.kind) ? n : -1)).filter((n) => n >= 0);
        return { label: g.label, t: idx.length, c: idx.filter((n) => scored[n]).length };
      })
      .filter((g) => g.t >= 3);
    const weak = Object.entries(bySkill)
      .filter(([, v]) => v.c < v.t)
      .sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t)
      .slice(0, 5);

    return (
      <>
        {strip}
        <div className="card">
          <div className="eyebrow">Hasil sesi</div>
          <h3 style={{ fontFamily: "var(--disp)", fontSize: 26, color: "var(--ink)", margin: "6px 0 14px" }}>
            {correct} dari {items.length} benar
          </h3>
          <div className="grid2">
            <div className="stat">
              <div className="n">{Math.round((correct / items.length) * 100)}%</div>
              <div className="l">Akurasi sesi</div>
            </div>
            <div className="stat">
              <div className="n">
                {mins}
                <span style={{ fontSize: 14 }}> mnt</span>
              </div>
              <div className="l">Waktu pengerjaan</div>
            </div>
          </div>
          {split.length > 1 && (
            <>
              <h2 className="sec">Per jenis soal</h2>
              {split.map((g) => {
                const p = Math.round((g.c / g.t) * 100);
                return (
                  <div className="bar" key={g.label}>
                    <div className="lab">{g.label}</div>
                    <div className="track">
                      <div className={`fill ${p < 55 ? "weak" : p >= 75 ? "strong" : ""}`} style={{ width: `${p}%` }} />
                    </div>
                    <div className="pct">{g.c}/{g.t}</div>
                  </div>
                );
              })}
            </>
          )}
          {weak.length > 0 && (
            <>
              <h2 className="sec">Yang perlu ditambal</h2>
              {weak.map(([k, v]) => {
                const p = Math.round((v.c / v.t) * 100);
                return (
                  <div className="bar" key={k}>
                    <div className="lab">{k}</div>
                    <div className="track">
                      <div className={`fill ${p < 50 ? "weak" : ""}`} style={{ width: `${p}%` }} />
                    </div>
                    <div className="pct">
                      {v.c}/{v.t}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <a className="btn" href="/">
            Kembali ke hari ini
          </a>
          <a className="btn ghost" href="/progress" style={{ marginTop: 8 }}>
            Lihat progres keseluruhan
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      {strip}
      <div className="card">
        {q.passage?.body && (
          <div className="passage">
            <h3>{q.passage.title}</h3>
            {q.passage.body.map((t, n) => (
              <p key={n}>{t}</p>
            ))}
          </div>
        )}
        {q.passage?.script && (
          <div className="script">
            <h3>{q.passage.title}</h3>
            {q.passage.script.map(([who, line], n) => (
              <p key={n}>
                <span className="who">{who}:</span> {line}
              </p>
            ))}
          </div>
        )}
        {q.script && !q.passage && (
          <div className="script">
            {q.script.map(([who, line], n) => (
              <p key={n}>
                <span className="who">{who}:</span> {line}
              </p>
            ))}
          </div>
        )}

        <div className="qnum">
          Soal {i + 1} · {KIND_LABEL[q.kind]}
        </div>
        <p className="stem" dangerouslySetInnerHTML={{ __html: q.stem }} />

        <div className="opts">
          {q.shown.map((o, n) => {
            const cls = ["opt"];
            if (answered) {
              if (n === q.key) cls.push("key");
              else if (n === picked[i]) cls.push("miss");
            }
            if (n === picked[i]) cls.push("picked");
            return (
              <button key={n} className={cls.join(" ")} disabled={answered} onClick={() => answer(n)}>
                <span className="mark">{LETTERS[n]}</span>
                <span dangerouslySetInnerHTML={{ __html: o }} />
              </button>
            );
          })}
        </div>

        {answered && (
          <>
            <div className={`verdict ${picked[i] === q.key ? "" : "bad"}`}>
              <div className="tag">
                <span>{picked[i] === q.key ? "Benar" : "Salah"}</span>
                <span className="skill">{q.skill}</span>
              </div>
              <p dangerouslySetInnerHTML={{ __html: q.exp }} />
            </div>
            {failed && (
              <p className="note" style={{ color: "var(--scarlet)" }}>
                Jawaban ini gagal tersimpan ke server. Periksa koneksi — soal berikutnya tetap bisa dikerjakan,
                tetapi yang satu ini tidak akan masuk hitungan.
              </p>
            )}
            <button className="btn" onClick={next}>
              {i + 1 < items.length ? "Soal berikutnya" : "Lihat hasil sesi"}
            </button>
          </>
        )}
      </div>
      <a className="btn ghost sm" href="/" style={{ marginTop: 6 }}>
        Keluar dari sesi
      </a>
    </>
  );
}