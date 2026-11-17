import Phaser from 'phaser';
import { QUIZ_QUESTIONS } from '@shared/scoring';
import { QUIZ_BANK, QUIZ_TEXT as T, QUIZ_TIME_MS, type QuizQuestion } from '../data/quiz';
import { nextStep } from '../systems/flow';
import { scoreTracker } from '../systems/scoreTracker';
import { createBar, type Bar } from '../ui/Bar';
import { createButton } from '../ui/Button';
import { label } from '../ui/text';

export class QuizScene extends Phaser.Scene {
  private questions: QuizQuestion[] = [];
  private index = 0;
  private correctCount = 0;
  private elapsed = 0;
  private questionLeft = 0;
  private answering = false;
  private view?: Phaser.GameObjects.Container;
  private timer!: Bar;
  private progress!: Phaser.GameObjects.Text;

  constructor() {
    super('Quiz');
  }

  create(): void {
    this.questions = Phaser.Utils.Array.Shuffle([...QUIZ_BANK]).slice(0, QUIZ_QUESTIONS);
    this.index = 0;
    this.correctCount = 0;
    this.elapsed = 0;

    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x22313f).setOrigin(0);
    label(this, width / 2, 60, T.title, 48, '#f2b705', true);
    this.progress = label(this, width / 2, 125, '', 30, '#9aa4ae', true);
    this.timer = createBar(this, 60, 185, 600, 34, 0x2ecc71);
    this.showQuestion();
  }

  override update(_time: number, delta: number): void {
    if (this.index >= this.questions.length) return;
    this.elapsed += delta;
    if (!this.answering) return;
    this.questionLeft -= delta;
    const ratio = this.questionLeft / QUIZ_TIME_MS;
    this.timer.set(ratio);
    this.timer.setColor(ratio > 0.3 ? 0x2ecc71 : 0xc0392b);
    if (this.questionLeft <= 0) this.answer(-1);
  }

  private showQuestion(): void {
    this.view?.destroy();
    const q = this.questions[this.index]!;
    const { width } = this.scale;
    this.progress.setText(T.progress(this.index + 1, this.questions.length));
    this.questionLeft = QUIZ_TIME_MS;
    this.answering = true;

    this.view = this.add.container(0, 0);
    this.view.add(label(this, width / 2, 330, q.question, 40, '#ffffff', true, 640));
    q.options.forEach((option, i) => {
      const y = 540 + i * 170;
      const bg = this.add.rectangle(width / 2, y, 640, 140, 0xf4f4f4).setStrokeStyle(5, 0x1b1f24).setInteractive({ useHandCursor: true });
      bg.setData('option', i);
      bg.on('pointerup', () => this.answer(i));
      this.view!.add([bg, label(this, width / 2, y, option, 32, '#111111', true, 600)]);
    });
  }

  /** i = -1 artinya waktu habis. */
  private answer(i: number): void {
    if (!this.answering) return;
    this.answering = false;
    const q = this.questions[this.index]!;
    const correct = i === q.correct;
    if (correct) this.correctCount++;

    for (const obj of this.view!.list) {
      const opt = (obj as Phaser.GameObjects.Rectangle).getData?.('option') as number | undefined;
      if (opt === undefined) continue;
      const rect = obj as Phaser.GameObjects.Rectangle;
      if (opt === q.correct) rect.setFillStyle(0x7CFC9A);
      else if (opt === i) rect.setFillStyle(0xff8a7a);
    }

    const { width } = this.scale;
    const head = correct ? T.correct : i < 0 ? T.timeUp : T.wrong;
    const body = correct ? q.explain : `${T.answer(q.options[q.correct])}\n${q.explain}`;
    this.view!.add(this.add.rectangle(width / 2, 1050, width - 40, 210, 0x1b1f24, 0.9));
    this.view!.add(label(this, width / 2, 990, head, 40, correct ? '#7CFC9A' : '#ff8a7a', true));
    this.view!.add(label(this, width / 2, 1070, body, 28, '#ffffff', false, 640));

    // Ditunda sebentar supaya tap jawaban tidak langsung kena tombol Lanjut.
    this.time.delayedCall(600, () => {
      this.view!.add(createButton(this, width / 2, 1215, T.next, () => this.next()));
    });
  }

  private next(): void {
    this.index++;
    if (this.index < this.questions.length) return this.showQuestion();
    scoreTracker.record('quiz', { correctCount: this.correctCount, durationMs: Math.round(this.elapsed) });
    nextStep(this);
  }
}
