import Chrome from "@/components/Chrome";
import { getSectionStats } from "@/lib/data";
import { totalScore } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function Plan() {
  const stats = await getSectionStats();
  const total = totalScore(stats);

  return (
    <>
      <Chrome tab="plan" score={total?.score ?? null} sub="Rencana sepuluh minggu" />

      <div className="card">
        <p style={{ margin: 0 }}>
          Tiga sesi per hari, enam hari seminggu. Beban harian 60 soal setara sekitar satu setengah jam.
          Minggu ke-10 disisakan untuk simulasi penuh dan penurunan beban menjelang tes.
        </p>
      </div>

      <h2 className="sec">Fase 1 · Fondasi</h2>
      <div className="phase">
        <span className="wk">Minggu 1–3</span>
        <h3>Kuasai pola, bukan kecepatan</h3>
        <ul>
          <li><strong>Pagi:</strong> Structure. Urutan bab Cliffs: kesesuaian subjek-verba, struktur paralel, klausa relatif, inversi, bentuk verba. Satu bab per dua hari, dibaca sebelum sesi.</li>
          <li><strong>Siang:</strong> Reading. Fokus satu jenis soal per minggu — minggu 1 gagasan utama, minggu 2 detail dan rujukan pronomina, minggu 3 kosakata dalam konteks.</li>
          <li><strong>Sore:</strong> Listening Part A. Hafalkan 20 idiom per minggu dari daftar idiom Cliffs.</li>
          <li>Belum ada batas waktu. Yang dikejar akurasi dan pemahaman pembahasan.</li>
        </ul>
        <span className="target">Target akhir fase: akurasi 60% di tiap section</span>
      </div>

      <h2 className="sec">Fase 2 · Penguatan terarah</h2>
      <div className="phase">
        <span className="wk">Minggu 4–7</span>
        <h3>Kejar tiga skill terlemah, tambahkan tekanan waktu</h3>
        <ul>
          <li>Buka tab Progres tiap Minggu. Ambil tiga skill terbawah, baca ulang babnya, lalu jalankan &quot;Ulang soal yang salah&quot; dua kali seminggu menggantikan sesi sore.</li>
          <li><strong>Structure:</strong> batasi waktu — 20 soal dalam 12 menit. Di tes asli: 25 menit untuk 40 soal.</li>
          <li><strong>Reading:</strong> baca satu bacaan dalam 3 menit sebelum menyentuh soal. Target 250 kata per menit.</li>
          <li><strong>Listening:</strong> pindah ke Part B dan C. Catat hanya angka, nama, dan kata setelah penanda seperti <em>it turns out</em> atau <em>for Thursday</em>.</li>
          <li>Satu hari per minggu tanpa latihan. Kelelahan menurunkan akurasi lebih cepat daripada kurangnya jam latihan.</li>
        </ul>
        <span className="target">Target akhir fase: 75% Structure, 70% Reading, 65% Listening</span>
      </div>

      <h2 className="sec">Fase 3 · Simulasi</h2>
      <div className="phase">
        <span className="wk">Minggu 8–10</span>
        <h3>Kondisi ujian, bukan latihan</h3>
        <ul>
          <li>Dua kali seminggu, gabungkan tiga sesi jadi satu blok tanpa jeda dengan timer: Listening ±35 menit, Structure 25 menit, Reading 55 menit.</li>
          <li>Catatan kesalahan: untuk tiap soal salah, tulis satu baris jenis kesalahannya — salah baca, tidak tahu polanya, atau kehabisan waktu.</li>
          <li>Tidak ada penalti jawaban salah di ITP, jadi tidak boleh ada soal kosong. Sisakan 60 detik di akhir tiap section.</li>
          <li>Tiga hari terakhir: hanya baca ulang catatan kesalahan dan daftar idiom. Tidak ada soal baru.</li>
        </ul>
        <span className="target">Target akhir fase: estimasi stabil di kisaran skor sasaran</span>
      </div>

      <h2 className="sec">Aturan main</h2>
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li style={{ marginBottom: 7 }}>Baca pembahasan soal yang <em>benar</em> juga. Jawaban benar karena tebakan akan muncul lagi sebagai kesalahan di bulan kedua.</li>
          <li style={{ marginBottom: 7 }}>Bank soal berputar: soal yang belum pernah muncul selalu didahulukan, dan soal yang pernah salah dinaikkan prioritasnya.</li>
          <li style={{ marginBottom: 7 }}>Estimasi skor baru bisa dipercaya setelah sekitar 150 soal. Sebelum itu, perhatikan tren akurasi per section.</li>
          <li>Listening di sini berbasis skrip. Untuk melatih telinga, putar rekaman Cliffs dengan skrip tertutup, lalu pakai sesi ini untuk membedah pola jawabannya.</li>
        </ul>
      </div>
    </>
  );
}
