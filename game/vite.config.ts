import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const sharedDir = fileURLToPath(new URL('../shared', import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@shared': sharedDir },
  },
  server: {
    // shared/ ada di luar folder game/
    fs: { allow: ['..'] },
    // API lokal dari `wrangler dev` (worker/). Proxy jalan di PC, jadi HP via --host ikut bisa.
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    // Phaser sendiri ±1.2 MB (minified); peringatan default 500 kB pasti kena.
    chunkSizeWarningLimit: 1500,
  },
});
