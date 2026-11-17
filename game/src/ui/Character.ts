import Phaser from 'phaser';
import type { Avatar } from '@shared/types';
import type { WearItem } from '../data/apd';
import { ART, ART_SCALE } from '../systems/art';

// Karakter pixel art modular: layer render Blender ditumpuk dalam satu kontainer (semua layer satu kanvas
// 98x130 piksel art). Skala kontainer 1 = ±260 px layar. Titik (0,0) = tengah sprite.

/** Area badan untuk drop APD, relatif ke titik (0,0) kontainer pada skala 1. */
export const BODY_AREA = new Phaser.Geom.Rectangle(-110, -130, 220, 260);

export class Character extends Phaser.GameObjects.Container {
  private readonly layers = new Map<string, Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene, x: number, y: number, avatar: Avatar) {
    super(scene, x, y);
    scene.add.existing(this);
    const add = (key: string, visible = true): void => {
      const img = scene.add.image(0, 0, ART, key).setScale(ART_SCALE).setVisible(visible);
      this.layers.set(key, img);
      this.add(img);
    };
    // Urutan tumpukan: bawah -> atas.
    add('ch_legs');
    add('ch_boots', false);
    add('ch_sandal', false);
    add(avatar.gender === 'male' ? 'ch_torso_m' : 'ch_torso_f');
    add('ch_vest', false);
    if (avatar.hair === 2) add('ch_hairback_2'); // rambut panjang: bagian belakang di bawah kepala
    add(`ch_hands_${avatar.skin}`);
    add(`ch_head_${avatar.skin}`);
    add(`ch_hair_${avatar.hair}`);
    add('ch_glasses', false);
    add('ch_cap', false);
    add('ch_helmet', false);
  }

  /** APD / item jebakan yang sedang dipakai. */
  setWorn(items: Iterable<WearItem>): this {
    const on = new Set<string>([...items].map((i) => `ch_${i}`));
    for (const key of ['ch_boots', 'ch_sandal', 'ch_vest', 'ch_glasses', 'ch_cap', 'ch_helmet']) {
      this.layers.get(key)?.setVisible(on.has(key));
    }
    return this;
  }

  /** Apakah titik dunia (x, y) ada di area badan karakter. */
  containsPoint(x: number, y: number): boolean {
    return BODY_AREA.contains((x - this.x) / this.scaleX, (y - this.y) / this.scaleY);
  }
}
