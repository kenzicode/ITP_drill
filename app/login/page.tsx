"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!email.trim()) return setMsg("Masukkan alamat email dulu.");
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    setMsg(error ? `Gagal mengirim: ${error.message}` : "Tautan masuk sudah dikirim. Cek email Anda.");
  }

  return (
    <>
      <header className="mast">
        <span className="eyebrow">TOEFL ITP · Paper-based</span>
        <h1>ITP Drill</h1>
        <span className="sub">Masuk untuk melanjutkan progres Anda</span>
      </header>
      <div className="card" style={{ marginTop: 24 }}>
        <p style={{ margin: "0 0 12px" }}>
          Masukkan email Anda. Kami kirim tautan masuk — tanpa kata sandi.
        </p>
        <input
          type="email"
          value={email}
          placeholder="nama@email.com"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn" onClick={send} disabled={busy}>
          {busy ? "Mengirim…" : "Kirim tautan masuk"}
        </button>
        {msg && <p className="note">{msg}</p>}
      </div>
    </>
  );
}
