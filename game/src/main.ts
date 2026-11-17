import Phaser from 'phaser';
import { ApdScene } from './scenes/ApdScene';
import { BootScene } from './scenes/BootScene';
import { CustomizeScene } from './scenes/CustomizeScene';
import { DumpingScene } from './scenes/DumpingScene';
import { HaulingScene } from './scenes/HaulingScene';
import { LoadingScene } from './scenes/LoadingScene';
import { P2hScene } from './scenes/P2hScene';
import { PreloadScene } from './scenes/PreloadScene';
import { QuizScene } from './scenes/QuizScene';
import { ReboisasiScene } from './scenes/ReboisasiScene';
import { RegisterScene } from './scenes/RegisterScene';
import { ResultScene } from './scenes/ResultScene';
import { TipScene } from './scenes/TipScene';

// Portrait 9:16. Resolusi 2x dari 360x640 biar teks tajam di HP layar padat.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  backgroundColor: '#1b1f24',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Hauling butuh 2 jari sekaligus (tahan gas + geser lajur).
  input: { activePointers: 2 },
  // Form registrasi pakai elemen HTML yang ikut di-scale bersama canvas.
  dom: { createContainer: true },
  // Scene pertama di array yang otomatis jalan.
  scene: [
    BootScene,
    PreloadScene,
    RegisterScene,
    CustomizeScene,
    ApdScene,
    P2hScene,
    LoadingScene,
    HaulingScene,
    ReboisasiScene,
    DumpingScene,
    QuizScene,
    ResultScene,
    TipScene,
  ],
});

// Dev only: akses dari console untuk debug/playtest.
if (import.meta.env.DEV) Object.assign(window, { game });
