import { matchPoint } from '../core/region.js';
import { getBufferSize } from '../core/coords.js';
import { isStepReady, colorForPoint } from './step.js';
import { stepAllowedOn } from './screen.js';

/**
 * Scoring the steps without touching the game.
 *
 * The engine answers "what should I click now"; this answers "what would you
 * do, and why not the rest" — which is the question behind every report of a
 * bot sitting still. It reads the same pixels through the same matcher, and
 * sends no clicks at all, so it is safe to run mid-fight.
 *
 * @typedef {'match'|'miss'|'gated'|'empty'|'off'} StepVerdict
 * @typedef {{ stepId: string, verdict: StepVerdict }} StepScore
 */

/**
 * Score one step against the frame on screen right now.
 *
 * @param {import('./step.js').Step} step
 * @param {WebGLRenderingContext} gl
 * @param {{ width: number, height: number }} buffer
 * @param {string} scaleMode
 * @param {string | null} screenId where the bot thinks it is
 * @returns {StepVerdict}
 */
export function scoreStep(step, gl, buffer, scaleMode, screenId) {
  if (!step.enabled) {
    return 'off';
  }
  if (!isStepReady(step)) {
    return 'empty';
  }
  if (!stepAllowedOn(step, screenId)) {
    return 'gated';
  }

  for (const storedPoint of step.points) {
    const hit = matchPoint(
      gl,
      storedPoint,
      colorForPoint(step, storedPoint),
      buffer,
      scaleMode,
      step.tolerance
    );
    if (hit.matched) {
      return 'match';
    }
  }
  return 'miss';
}

/**
 * Score a whole list in one pass.
 *
 * @returns {StepScore[]} empty when there is no canvas to read
 */
export function scoreSteps(steps, target, scaleMode, screenId) {
  if (!target) {
    return [];
  }
  const buffer = getBufferSize(target.canvas);
  return steps.map((step) => ({
    stepId: step.id,
    verdict: scoreStep(step, target.gl, buffer, scaleMode, screenId),
  }));
}
