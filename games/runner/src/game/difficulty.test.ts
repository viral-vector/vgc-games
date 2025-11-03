import { describe, expect, it } from 'vitest';
import {
  advanceDifficulty,
  createDifficultyState,
  getScoreIncrement,
  getSpawnDelay
} from './difficulty';

describe('difficulty helpers', () => {
  it('accelerates the game as distance increases', () => {
    const state = createDifficultyState(260);
    const first = advanceDifficulty({ ...state }, 1000);
    const later = advanceDifficulty({ ...state, distance: 8000 }, 1000);

    expect(first.speed).toBeGreaterThanOrEqual(260);
    expect(later.speed).toBeGreaterThan(first.speed);
  });

  it('never exceeds the configured maximum speed', () => {
    const state = advanceDifficulty({ speed: 520, distance: 10000 }, 2000);

    expect(state.speed).toBeLessThanOrEqual(520);
  });

  it('tightens spawn windows as score climbs', () => {
    const early = getSpawnDelay(10);
    const late = getSpawnDelay(800);

    expect(early).toBeGreaterThan(late);
    expect(late).toBeGreaterThanOrEqual(380);
  });

  it('translates delta time and speed into score increments', () => {
    const fast = getScoreIncrement(1000, 520);
    const slow = getScoreIncrement(1000, 260);

    expect(fast).toBeGreaterThan(slow);
    expect(Math.round(slow)).toBeGreaterThan(0);
  });
});
