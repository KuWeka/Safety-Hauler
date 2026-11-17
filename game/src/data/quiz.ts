// Bank soal kuis safety. Draf umum, WAJIB divalidasi tim K3 Arutmin sebelum event (lihat GDD).
// Nanti bisa diganti dari config quiz_bank di server (Fase 3).
export interface QuizQuestion {
  question: string;
  options: [string, string, string];
  correct: 0 | 1 | 2;
  explain: string;
}

export const QUIZ_BANK: QuizQuestion[] = [
  {
    question: 'Kapan P2H unit wajib dilakukan?',
    options: ['Kalau sempat saja', 'Sebelum unit dipakai tiap shift', 'Seminggu sekali'],
    correct: 1,
    explain: 'P2H dilakukan tiap awal shift sebelum unit dioperasikan.',
  },
  {
    question: 'HD bertemu LV di persimpangan. Yang benar?',
    options: ['HD tancap gas duluan', 'Klakson panjang lalu jalan', 'Pelan, siap berhenti, pastikan aman'],
    correct: 2,
    explain: 'Di persimpangan, pelan dan pastikan jalur aman sebelum lewat.',
  },
  {
    question: 'Fungsi safety berm di dumping point adalah...',
    options: ['Penahan roda agar unit tidak terperosok', 'Tempat parkir LV', 'Hiasan jalan tambang'],
    correct: 0,
    explain: 'Berm menahan unit supaya tidak terperosok ke area dumping.',
  },
  {
    question: 'Rompi reflektif dipakai supaya...',
    options: ['Terlihat keren', 'Mudah terlihat operator unit lain', 'Badan tidak kepanasan'],
    correct: 1,
    explain: 'Rompi reflektif membuat pekerja mudah terlihat, terutama malam hari.',
  },
  {
    question: 'Jalan tambang licin habis hujan. Operator sebaiknya...',
    options: ['Kurangi kecepatan dan jaga jarak', 'Ngebut biar cepat lewat', 'Rem mendadak tiap tikungan'],
    correct: 0,
    explain: 'Jalan licin: pelan, jaga jarak, hindari rem mendadak.',
  },
  {
    question: 'Saat HD mundur ke dumping point, operator mengikuti...',
    options: ['Perasaan sendiri', 'Aba-aba spotter', 'Suara klakson unit lain'],
    correct: 1,
    explain: 'Spotter memandu posisi mundur supaya tidak menabrak berm.',
  },
  {
    question: 'Kenapa muatan HD tidak boleh overload?',
    options: ['Bikin bak cepat kotor', 'Rem dan ban bekerja berlebih, rawan celaka', 'Tidak ada pengaruhnya'],
    correct: 1,
    explain: 'Overload membebani rem, ban, dan kemudi sehingga rawan kecelakaan.',
  },
  {
    question: 'Debu tebal menutup pandangan di jalan hauling. Yang benar?',
    options: ['Pelan dan ikuti patok jalan', 'Matikan lampu', 'Pindah-pindah lajur'],
    correct: 0,
    explain: 'Saat jarak pandang rendah, pelan dan ikuti patok jalan.',
  },
  {
    question: 'Rambu batas kecepatan di jalan tambang artinya...',
    options: ['Target kecepatan minimum', 'Kecepatan maksimum yang diizinkan', 'Hanya berlaku malam hari'],
    correct: 1,
    explain: 'Angka di rambu adalah batas maksimum, bukan target.',
  },
  {
    question: 'Ketemu kerusakan saat P2H. Langkah yang benar?',
    options: ['Tetap jalan, nanti saja', 'Laporkan dan unit tidak dipakai sampai diperbaiki', 'Perbaiki sendiri seadanya'],
    correct: 1,
    explain: 'Kerusakan dilaporkan dan unit diperbaiki dulu sebelum dipakai.',
  },
  {
    question: 'APD yang melindungi kepala dari benda jatuh adalah...',
    options: ['Topi biasa', 'Helm safety', 'Kacamata safety'],
    correct: 1,
    explain: 'Helm safety dirancang menahan benturan dan benda jatuh.',
  },
  {
    question: 'Kenapa sepatu safety wajib di area tambang?',
    options: ['Melindungi kaki dari tertimpa dan tertusuk', 'Biar langkah lebih cepat', 'Supaya seragam'],
    correct: 0,
    explain: 'Sepatu safety punya pelindung ujung dan sol tahan tusuk.',
  },
  {
    question: 'Operator merasa sangat mengantuk saat shift. Sebaiknya...',
    options: ['Lanjut kerja sambil minum kopi', 'Lapor pengawas dan istirahat', 'Ngebut biar cepat selesai'],
    correct: 1,
    explain: 'Kelelahan memicu kecelakaan. Lapor dan istirahat dulu.',
  },
  {
    question: 'Pakai HP saat mengoperasikan unit itu...',
    options: ['Boleh kalau jalan sepi', 'Dilarang, mengganggu konsentrasi', 'Boleh untuk foto'],
    correct: 1,
    explain: 'HP mengalihkan perhatian dan bisa menyebabkan kecelakaan.',
  },
  {
    question: 'Sabuk pengaman di kabin unit dipakai...',
    options: ['Selalu, setiap unit bergerak', 'Hanya di jalan menanjak', 'Kalau diawasi saja'],
    correct: 0,
    explain: 'Sabuk pengaman wajib dipakai setiap unit beroperasi.',
  },
  {
    question: 'Reklamasi lahan bekas tambang tujuannya...',
    options: ['Memulihkan lahan supaya bisa ditumbuhi lagi', 'Menutup jalan tambang', 'Membuat lahan parkir'],
    correct: 0,
    explain: 'Reklamasi memulihkan lahan bekas tambang agar kembali produktif.',
  },
  {
    question: 'Topsoil di reklamasi berguna untuk...',
    options: ['Tempat tumbuh tanaman', 'Menahan air hujan saja', 'Bahan bakar'],
    correct: 0,
    explain: 'Topsoil (tanah pucuk) kaya hara sehingga bibit bisa tumbuh.',
  },
  {
    question: 'Jarak aman mengikuti unit di depan dijaga supaya...',
    options: ['Bisa nyalip kapan saja', 'Ada waktu cukup untuk mengerem', 'Debu tidak kena'],
    correct: 1,
    explain: 'Jarak aman memberi waktu reaksi dan pengereman.',
  },
  {
    question: 'Melihat kondisi tidak aman di area kerja, kamu...',
    options: ['Diam saja, bukan urusanku', 'Laporkan ke pengawas', 'Tunggu ada kecelakaan dulu'],
    correct: 1,
    explain: 'Setiap orang wajib melaporkan kondisi tidak aman.',
  },
  {
    question: 'Sebelum turun dari unit, operator harus...',
    options: ['Langsung lompat turun', 'Parkir aman, rem parkir aktif, mesin mati', 'Biarkan mesin menyala'],
    correct: 1,
    explain: 'Unit diparkir aman dan diamankan sebelum ditinggal.',
  },
];

export const QUIZ_TIME_MS = 10_000;

export const QUIZ_TEXT = {
  title: 'Kuis Safety',
  progress: (i: number, total: number) => `Soal ${i}/${total}`,
  correct: 'Benar!',
  wrong: 'Kurang tepat.',
  timeUp: 'Waktu habis!',
  answer: (a: string) => `Jawaban: ${a}`,
  next: 'Lanjut',
};
