import Phaser from 'phaser';
import type { Avatar } from '@shared/types';
import type { WearItem } from '../data/apd';
import { HAIR_COLOR, PANTS_COLOR, SHIRT_COLORS, SKIN_COLORS } from '../data/customize';

// shortcut: karakter placeholder dari bentuk sederhana; diganti sprite render Blender di Fase 4.
// Titik (0,0) = tengah pinggang. Tinggi total ±500 px pada skala 1.

/** Area badan untuk drop APD, relatif ke titik (0,0) karakter. */
export const BODY_AREA = new Phaser.Geom.Rectangle(-140, -370, 280, 530);

export class Character extends Phaser.GameObjects.Container {
  private readonly worn = new Map<WearItem, Phaser.GameObjects.GameObject[]>();

  constructor(scene: Phaser.Scene, x: number, y: number, avatar: Avatar) {
    super(scene, x, y);
    scene.add.existing(this);
    this.draw(avatar);
  }

  private draw(avatar: Avatar): void {
    const s = this.scene.add;
    const skin = SKIN_COLORS[avatar.skin];
    const shirt = SHIRT_COLORS[avatar.gender];
    const dark = 0x1b1f24;

    if (avatar.hair === 2) this.add(s.rectangle(0, -245, 200, 210, HAIR_COLOR)); // rambut panjang (belakang)
    this.add([
      s.rectangle(-35, 0, 50, 120, PANTS_COLOR).setOrigin(0.5, 0),
      s.rectangle(35, 0, 50, 120, PANTS_COLOR).setOrigin(0.5, 0),
      s.ellipse(-38, 128, 62, 26, skin),
      s.ellipse(38, 128, 62, 26, skin),
      s.rectangle(-105, -90, 36, 150, shirt).setStrokeStyle(3, dark),
      s.rectangle(105, -90, 36, 150, shirt).setStrokeStyle(3, dark),
      s.circle(-105, -10, 20, skin),
      s.circle(105, -10, 20, skin),
      avatar.gender === 'male'
        ? s.rectangle(0, -85, 170, 172, shirt).setStrokeStyle(4, dark)
        : s.polygon(0, -85, [-70, -86, 70, -86, 90, 86, -90, 86], shirt).setStrokeStyle(4, dark),
      s.rectangle(0, -180, 40, 30, skin),
      s.circle(0, -265, 85, skin).setStrokeStyle(4, dark),
      s.circle(-30, -262, 9, dark),
      s.circle(30, -262, 9, dark),
      s.rectangle(0, -222, 34, 6, 0x8a4b3a),
    ]);
    if (avatar.hair === 1) {
      for (let i = -2; i <= 2; i++) this.add(s.triangle(i * 34, -330, -24, 30, 0, -30, 24, 30, HAIR_COLOR));
    } else {
      this.add(s.ellipse(0, -330, 178, 80, HAIR_COLOR)); // poni atas (gaya 0 dan 2)
    }

    // Lapisan APD / item jebakan (disembunyikan sampai dipakai).
    const layer = (item: WearItem, objs: Phaser.GameObjects.GameObject[]): void => {
      objs.forEach((o) => (o as Phaser.GameObjects.Shape).setVisible(false));
      this.add(objs);
      this.worn.set(item, objs);
    };
    layer('helmet', [s.ellipse(0, -328, 204, 124, 0xf2c200).setStrokeStyle(5, dark), s.rectangle(0, -296, 236, 18, 0xd9a400).setStrokeStyle(3, dark)]);
    layer('cap', [s.ellipse(0, -325, 186, 96, 0xc0392b).setStrokeStyle(4, dark), s.rectangle(70, -292, 120, 18, 0x922b21)]);
    layer('glasses', [s.rectangle(0, -262, 156, 36, 0x88c8ff, 0.55).setStrokeStyle(5, dark)]);
    layer('vest', [
      s.rectangle(0, -85, 178, 174, 0xff7a00).setStrokeStyle(4, dark),
      s.rectangle(0, -110, 178, 14, 0xe6e6e6),
      s.rectangle(0, -55, 178, 14, 0xe6e6e6),
    ]);
    layer('boots', [
      s.rectangle(-38, 118, 66, 56, 0x222222).setStrokeStyle(3, 0x555555),
      s.rectangle(38, 118, 66, 56, 0x222222).setStrokeStyle(3, 0x555555),
      s.rectangle(-58, 136, 22, 20, 0xf2c200),
      s.rectangle(18, 136, 22, 20, 0xf2c200),
    ]);
    layer('sandal', [s.ellipse(-38, 134, 68, 20, 0x8e5b3a), s.ellipse(38, 134, 68, 20, 0x8e5b3a), s.rectangle(0, 122, 150, 8, 0x5d3a22)]);
  }

  setWorn(items: Iterable<WearItem>): this {
    const on = new Set(items);
    for (const [item, objs] of this.worn) objs.forEach((o) => (o as Phaser.GameObjects.Shape).setVisible(on.has(item)));
    return this;
  }

  /** Apakah titik dunia (x, y) ada di area badan karakter. */
  containsPoint(x: number, y: number): boolean {
    return BODY_AREA.contains((x - this.x) / this.scaleX, (y - this.y) / this.scaleY);
  }
}
