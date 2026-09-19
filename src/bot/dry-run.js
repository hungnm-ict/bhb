import { matchPoint } from '../core/region.js';
import { getBufferSize } from '../core/coords.js';
import { isStepReady, colorForPoint, StepKind } from './step.js';
import { stepAllowedOn } from './screen.js';

/**
 * Scoring the steps without touching the game.
 *
 * The engine answers "what should I click now"; this answers "what would you
 * do, and why not the rest" — which is the question behind every report of a
 * bot sitting still. It reads the same pixels through the same matcher, and
 * sends no clicks at all, so it is safe to run mid-fight.
 *
 * @typedef {'match'|'miss'|'gated'|'empty'|'off'|'waiting'} StepVerdict
 * @typedef {{ stepId: string, verdict: StepVerdict, drift?: number,
 *   seen?: string }} StepScore a miss carries how far its closest colour was
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
  return scoreStepDetail(step, gl, buffer, scaleMode, screenId).verdict;
}

/**
 * The same score, plus how close a miss came.
 *
 * "miss" alone leaves the user guessing between a wrong place and a colour a
 * shade off — which is the difference between re-capturing the step and
 * nudging its tolerance.
 *
 * @returns {{ verdict: StepVerdict, drift?: number, seen?: string }}
 */
export function scoreStepDetail(step, gl, buffer, scaleMode, screenId) {
  if (!step.enabled) {
    return { verdict: 'off' };
  }
  if (!isStepReady(step)) {
    return { verdict: 'empty' };
  }
  if (!stepAllowedOn(step, screenId)) {
    return { verdict: 'gated' };
  }

  let nearest = null;
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
      // A wait step matching is the sequence being held, not a step about to
      // fire — reporting it as a match would read as the opposite of the truth.
      return { verdict: step.kind === StepKind.WAIT ? 'waiting' : 'match' };
    }
    if (typeof hit.drift === 'number' && (!nearest || hit.drift < nearest.drift)) {
      nearest = { drift: hit.drift, seen: hit.seen };
    }
  }
  if (step.kind === StepKind.WAIT) {
    return { verdict: 'match' };
  }
  return { verdict: 'miss', ...(nearest || {}) };
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
    ...scoreStepDetail(step, target.gl, buffer, scaleMode, screenId),
  }));
}
