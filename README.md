# ITP Drill — latihan TOEFL ITP

Next.js 14 (App Router) + Supabase + Vercel. Latihan terstruktur tiga sesi per hari
(pagi Structure, siang Reading, sore Listening), 20 soal per sesi, dengan umpan balik
langsung, pembahasan, diagnosis per skill, dan estimasi skor ITP.

## Yang perlu Anda tahu lebih dulu

- **Estimasi skor adalah aproksimasi**, bukan tabel konversi resmi ETS. Kurvanya ada di
  `lib/scoring.ts` dan sengaja dibuat eksplisit supaya bisa dikalibrasi ulang begitu Anda
  punya hasil tes sungguhan. Perlakukan sebagai indikator tren per section.
- **Listening berbasis skrip.** Soalnya melatih pola jawaban dan idiom, bukan pendengaran.
  Untuk melatih telinga, gunakan rekaman terpisah dengan skrip tertutup.
- **Kebenaran jawaban ditentukan di server** (`app/api/attempt/route.ts`), bukan dikirim
  dari klien, supaya statistiknya tidak bisa rusak oleh state yang kacau di browser.

## Setup

### 1. Supabase

Buat proyek baru, lalu di SQL Editor jalankan berurutan:

```
supabase/schema.sql   -- tabel, RLS, view diagnosis
supabase/seed.sql     -- 132 soal + 6 passage
```

Di Authentication → Providers, pastikan Email aktif. Di URL Configuration, tambahkan
`https://<domain-anda>/auth/callback` sebagai redirect URL (dan
`http://localhost:3000/auth/callback` untuk pengembangan lokal).

### 2. Lokal

```bash
cp .env.local.example .env.local   # isi URL dan anon key dari Project Settings → API
npm install
npm run dev
```

### 3. Vercel

Import repo, isi tiga environment variable yang sama dengan `.env.local`, deploy.
Setelah dapat domain, perbarui `NEXT_PUBLIC_SITE_URL` dan redirect URL di Supabase.

## Struktur

```
app/
  page.tsx              dasbor "Hari ini" — sesi, status, riwayat
  session/[slot]/       menyusun sesi lalu menyerahkannya ke <Drill>
  progress/             estimasi skor, skor per section, skill terlemah
  plan/                 rencana 10 minggu
  api/attempt/          mencatat satu jawaban, menentukan benar/salah
  api/finish/           menutup sesi, menghitung ulang skornya dari attempts
lib/
  session.ts            komposisi sesi dan rotasi soal
  scoring.ts            kurva konversi akurasi → skor terskala
  data.ts               query ke Supabase
components/Drill.tsx    lembar jawaban, soal, pembahasan, hasil sesi
```

## Menambah soal

Satu `INSERT` ke tabel `questions`; tidak perlu deploy ulang.

```sql
insert into questions (id, section, kind, skill, stem, opts, ans, exp)
values ('S40', 'structure', 'plain', 'Inversi',
        'Seldom ____ so clearly stated.',
        '["has the rule been","the rule has been","has been the rule","the rule been"]'::jsonb,
        0, 'Adverbia negatif di awal kalimat menuntut inversi.');
```

Untuk soal Written Expression, tandai bagian yang digarisbawahi dengan
`<u>teks<sup>A</sup></u>` di dalam `stem`, isi `opts` dengan keempat penggalan sesuai
urutan A–D, dan set `no_shuffle = true`.

Untuk Reading atau Listening Part B/C, masukkan `passages` lebih dulu, lalu isi
`passage_id` pada soalnya.

## Rotasi soal

`lib/session.ts` mendahulukan soal yang paling jarang dikerjakan, lalu yang paling lama
tidak muncul. Sesi "Ulang soal yang salah" mengambil soal dengan hitungan salah tertinggi;
menjawab benar mengurangi hitungan itu sampai nol, jadi antreannya menyusut sendiri.

Dengan 132 soal, satu putaran penuh habis dalam sekitar seminggu. Tambahkan batch baru
sebelum itu supaya Anda tidak menghafal jawabannya.
