// P2H (Pemeriksaan Harian) excavator: 4 titik cek, satu bermasalah acak tiap run.
// Istilah dan isi checklist perlu divalidasi tim K3 (lihat GDD).
export const P2H_POINTS = [
  {
    key: 'track',
    label: 'Track',
    x: 230,
    y: 800,
    ok: 'Track rapat, sepatu track dan baut lengkap.',
    problem: 'Ada baut sepatu track yang hilang dan satu sepatu goyang.',
  },
  {
    key: 'lamp',
    label: 'Lampu',
    x: 470,
    y: 470,
    ok: 'Lampu kerja menyala terang semua.',
    problem: 'Lampu kerja kanan mati, kacanya retak.',
  },
  {
    key: 'oil',
    label: 'Oli',
    x: 520,
    y: 690,
    ok: 'Kering, tidak ada rembesan di bawah mesin.',
    problem: 'Ada tetesan oli hidrolik di bawah mesin.',
  },
  {
    key: 'mirror',
    label: 'Kaca/Spion',
    x: 300,
    y: 450,
    ok: 'Kaca kabin bersih, spion utuh dan tidak goyang.',
    problem: 'Spion kiri pecah, pandangan ke belakang terhalang.',
  },
] as const;

export const P2H_TEXT = {
  title: 'P2H Unit',
  hint: 'Tap semua titik cek, baca hasilnya, lalu laporkan yang bermasalah.',
  report: 'Laporkan kerusakan',
  reportHint: 'Tap titik yang bermasalah!',
  skip: 'Langsung naik unit',
  checked: (n: number, total: number) => `Dicek: ${n}/${total}`,
  correct: 'Laporan tepat! Unit diperbaiki dulu.',
  wrong: (label: string) => `Yang bermasalah: ${label}.`,
};
