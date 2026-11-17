import { defineConfig } from 'vite';

// Disajikan di /admin pada hosting yang sama dengan game. Build admin SETELAH game
// (build game mengosongkan game/dist).
export default defineConfig({
  base: '/admin/',
  build: {
    outDir: '../game/dist/admin',
    emptyOutDir: true,
  },
});
