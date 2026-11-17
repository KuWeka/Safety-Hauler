import type { StageData } from '@shared/types';

// Data mentah run yang sedang dimainkan (memori saja; antrean IndexedDB menyusul di Fase 3).
let stages: Partial<StageData> = {};

export const scoreTracker = {
  record<K extends keyof StageData>(key: K, data: StageData[K]): void {
    stages[key] = data;
  },
  get stages(): Readonly<Partial<StageData>> {
    return stages;
  },
  reset(): void {
    stages = {};
  },
};
