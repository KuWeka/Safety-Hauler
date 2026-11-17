// Validasi data pemain (dipakai game dan nanti worker). Pure, tanpa I/O.
// Cek kewajaran data run (durasi minimal, dll) menyusul di Fase 3.

/**
 * Normalisasi no HP Indonesia ke format 08xxxxxxxxxx.
 * Terima "+62 812-3456-7890", "6281234567890", "0812 3456 7890". Return null kalau tidak valid.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+62')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('62')) digits = '0' + digits.slice(2);
  return /^08\d{8,11}$/.test(digits) ? digits : null;
}

export const NAME_MIN = 2;
export const NAME_MAX = 30;

/** Nama dirapikan (spasi ganda dibuang). Return null kalau terlalu pendek/panjang. */
export function normalizeName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, ' ');
  return name.length >= NAME_MIN && name.length <= NAME_MAX ? name : null;
}
