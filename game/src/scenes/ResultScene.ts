import { SAFETY_START } from '@shared/scoring';
import { UI_TEXT } from '../data/stages';
import { label } from '../ui/text';
import { PlaceholderScene } from './PlaceholderScene';

export class ResultScene extends PlaceholderScene {
  constructor() {
    super('Result');
  }

  override create(): void {
    super.create();
    const { width, height } = this.scale;
    label(this, width / 2, height * 0.6, UI_TEXT.safetyMax(SAFETY_START), 36, '#f2b705');
  }
}
