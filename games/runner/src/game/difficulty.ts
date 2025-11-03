export interface DifficultyState {
  /** Current scroll speed applied to obstacles (pixels per second). */
  speed: number;
  /** Total distance travelled by the player surrogate (pixels). */
  distance: number;
}

const BASE_SPEED = 260;
const MAX_SPEED = 520;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const createDifficultyState = (initialSpeed = BASE_SPEED): DifficultyState => ({
  speed: initialSpeed,
  distance: 0
});

export const advanceDifficulty = (
  state: DifficultyState,
  deltaMs: number
): DifficultyState => {
  const deltaSeconds = deltaMs / 1000;
  state.distance += state.speed * deltaSeconds;

  const targetSpeed = BASE_SPEED + state.distance * 0.0025;
  state.speed = clamp(targetSpeed, BASE_SPEED, MAX_SPEED);

  return state;
};

export const getSpawnDelay = (score: number): number => {
  const maxDelay = 1400;
  const minDelay = 380;
  const difficultyOffset = clamp(Math.floor(score / 10) * 35, 0, 820);
  const desired = maxDelay - difficultyOffset;

  return clamp(desired, minDelay, maxDelay);
};

export const getScoreIncrement = (deltaMs: number, speed: number): number =>
  (speed * deltaMs) / 1600;
