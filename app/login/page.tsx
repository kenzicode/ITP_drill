"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (!email.trim() || !password) {
      setMsg("Email dan kata sandi harus diisi.");
      return;
    }
    setBusy(true);
    setMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setMsg(
        error.message === "Invalid login credentials"
          ? "Email atau kata sandi salah."
          : `Gagal masuk: ${error.message}`
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="mast">
        <span className="eyebrow">TOEFL ITP · Paper-based</span>
        <h1>ITP Drill</h1>
        <span className="sub">Masuk untuk melanjutkan progres Anda</span>
      </header>

      <div className="card" style={{ marginTop: 24 }}>
        <label className="eyebrow" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          placeholder="nama@email.com"
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginTop: 6 }}
        />

        <label className="eyebrow" htmlFor="password" style={{ display: "block", marginTop: 14 }}>
          Kata sandi
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && signIn()}
          style={{ marginTop: 6 }}
        />

        <button className="btn" onClick={signIn} disabled={busy}>
          {busy ? "Memeriksa…" : "Masuk"}
        </button>

        {msg && <p className="note" style={{ color: "var(--scarlet)" }}>{msg}</p>}

        <p className="note" style={{ marginTop: 14 }}>
          Akun dibuat sekali dari dashboard Supabase — Authentication → Users → Add user, dengan
          opsi Auto Confirm User aktif. Tidak ada email yang dikirim, jadi tidak ada batas
          pengiriman yang bisa terlampaui.
        </p>
      </div>
    </>
  );
}