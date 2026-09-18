import { SCRIPT_PACE_LADDER } from './constants.js';

/** Where a run starts: mid-sequence speed, since starting is mid-sequence. */
export const FIRST_PACE = SCRIPT_PACE_LADDER[0];

/**
 * How long to wait before the next tick.
 *
 * A click means the sequence is moving and the next screen is already
 * rendering, so the loop drops to the fastest rung. Anything else steps one
 * rung slower, down to a floor that costs nothing to sit at.
 *
 * @param {number | null | undefined} current the pace that just elapsed
 * @param {boolean} clicked whether that tick clicked a step
 * @returns {number} milliseconds
 */
export function nextPace(current, clicked) {
  if (clicked) {
    return FIRST_PACE;
  }
  // An off-ladder value (an older build, a hand-edited setting) still has to
  // land somewhere, so it rejoins at the first rung above it.
  const elapsed = Number(current) || FIRST_PACE;
  const index = SCRIPT_PACE_LADDER.findIndex((pace) => pace >= elapsed);
  if (index < 0) {
    return SCRIPT_PACE_LADDER[SCRIPT_PACE_LADDER.length - 1];
  }
  const step = SCRIPT_PACE_LADDER[index] === elapsed ? index + 1 : index;
  return SCRIPT_PACE_LADDER[Math.min(step, SCRIPT_PACE_LADDER.length - 1)];
}
