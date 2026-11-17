// Teks pesan jaringan / server (Bahasa Indonesia santai).
export const NET_TEXT = {
  connecting: 'Menyiapkan tugas...',
  registering: 'Mendaftarkan...',
  checking: 'Memeriksa jatah main...',
  retry: 'Coba lagi',
  back: 'Kembali',
  network: 'Butuh sinyal untuk mulai. Cek koneksi internetmu lalu coba lagi.',
  eventClosed: 'Event belum dibuka atau sudah ditutup. Tanya panitia ya.',
  quotaExceeded: 'Jatah mainmu sudah habis. Terima kasih sudah ikut!',
  rateLimited: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
  generic: 'Ada masalah di server. Coba lagi sebentar lagi.',
  runsLeft: (n: number) => `Sisa main: ${n}x`,
  blockedQuota: 'Jatah mainmu sudah habis. Terima kasih sudah ikut!',
  viewLeaderboard: 'Lihat Leaderboard',
};

export function errorMessage(code: string): string {
  switch (code) {
    case 'network':
      return NET_TEXT.network;
    case 'event_closed':
      return NET_TEXT.eventClosed;
    case 'quota_exceeded':
      return NET_TEXT.quotaExceeded;
    case 'rate_limited':
      return NET_TEXT.rateLimited;
    default:
      return NET_TEXT.generic;
  }
}
