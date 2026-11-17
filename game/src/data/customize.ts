// Pilihan kustomisasi karakter (GDD: cowok/cewek, 3 gaya rambut, 3 warna kulit).
export const SKIN_COLORS = [0xf3d2b3, 0xd9a47a, 0x9a6845] as const;
export const HAIR_COLOR = 0x2b1d14;
export const SHIRT_COLORS = { male: 0x3b6ea8, female: 0xb0517a } as const;
export const PANTS_COLOR = 0x2f3640;

export const CUSTOMIZE_TEXT = {
  title: 'Kustomisasi Karakter',
  gender: 'Karakter',
  male: 'Cowok',
  female: 'Cewek',
  hair: 'Rambut',
  skin: 'Kulit',
  next: 'Lanjut',
};
