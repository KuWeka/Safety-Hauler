import type Phaser from 'phaser';
import { FLOW, RESTART_INDEX, type FlowStep } from '../data/stages';
import { scoreTracker } from './scoreTracker';
import { session } from './session';

let index = 0;

export const currentStep = (): FlowStep => FLOW[index]!;
export const currentIndex = (): number => index;

/** Jalankan tahap di FLOW[i] langsung, tanpa layar tip. */
export function startStep(scene: Phaser.Scene, i: number): void {
  index = i;
  const step = FLOW[i]!;
  scene.scene.start(step.scene, { part: step.part });
}

/** Pindah ke tahap berikutnya; lewat layar Safety Tip kalau tahapnya minta. */
export function nextStep(scene: Phaser.Scene): void {
  const i = index + 1 < FLOW.length ? index + 1 : RESTART_INDEX;
  if (i === RESTART_INDEX) {
    scoreTracker.reset();
    session.reset();
  }
  if (FLOW[i]!.tip) {
    index = i;
    scene.scene.start('Tip');
  } else {
    startStep(scene, i);
  }
}
