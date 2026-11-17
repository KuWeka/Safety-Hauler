// Teks + pilihan form registrasi (GDD bagian 1. Registrasi).
export const DIVISIONS = ['Arutmin', 'Kontraktor', 'Umum'] as const;
export const DIVISION_OTHER = 'Lainnya';

export const REGISTER_TEXT = {
  title: 'Daftar Operator',
  subtitle: 'Isi data dulu sebelum masuk tambang.',
  name: 'Nama',
  namePlaceholder: 'Nama panggilan',
  division: 'Divisi / perusahaan',
  divisionPick: 'Pilih...',
  otherPlaceholder: 'Tulis divisi / perusahaan',
  phone: 'No HP',
  phonePlaceholder: '08xxxxxxxxxx',
  consent: 'No HP hanya dipakai untuk menghubungi pemenang.',
  submit: 'Daftar',
  errName: 'Nama 2–30 huruf ya.',
  errDivision: 'Pilih atau tulis divisi dulu.',
  errPhone: 'No HP belum benar. Contoh: 081234567890',
  errConsent: 'Centang persetujuan dulu ya.',
  welcomeBack: (name: string) => `Halo lagi, ${name}!`,
  continue: 'Lanjut main',
  change: 'Ganti pemain',
};
