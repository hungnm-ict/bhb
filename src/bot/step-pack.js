import { createStepId } from './step.js';

/**
 * Carrying a set of steps between windows.
 *
 * Every instance is its own browser profile, so nothing is shared: moving a
 * Dungeon combo to another window means text out of one and into the other.
 * The whole-profile export could not do this — importing one replaced every
 * profile on the far side, so copying one activity cost the user everything
 * else they had captured.
 *
 * A pack carries the canvas it was captured on. Steps already scale by the
 * `bw`/`bh` they were stored with, but scaling only holds while the aspect
 * does, and a pack landing on a differently pinned window is worth saying out
 * loud rather than letting the bot click past the buttons.
 */

const KIND = 'bhb.steps';
const VERSION = 1;

/**
 * @param {import('./step.js').Step[]} steps
 * @param {{ width: number, height: number } | null} lock the pinned size, if any
 * @returns {string}
 */
export function exportSteps(steps, lock) {
  return JSON.stringify(
    {
      kind: KIND,
      version: VERSION,
      lock: lock ? { width: lock.width, height: lock.height } : null,
      steps,
    },
    null,
    2
  );
}

/**
 * @param {string} json
 * @returns {{ steps: import('./step.js').Step[], lock: { width: number, height: number } | null }}
 * @throws {Error} when the text is not a step pack
 */
export function importSteps(json) {
  const parsed = JSON.parse(json);
  if (!parsed || parsed.kind !== KIND || !Array.isArray(parsed.steps)) {
    throw new Error('not a BHB step pack');
  }
  return {
    // Fresh ids: the far side has its own steps, and two windows sharing an id
    // is how a highlight or a dry run points at the wrong row.
    steps: parsed.steps.map((step) => ({ ...step, id: createStepId() })),
    lock: parsed.lock || null,
  };
}

/**
 * Fold a pack into the steps a profile already has.
 *
 * Whatever activities the pack carries are replaced outright; everything else
 * is left where it is. That makes importing the same pack twice leave one
 * copy, which is what "copy my Dungeon combo over" means — appending would
 * quietly double it every time the user pasted again.
 *
 * @param {import('./step.js').Step[]} existing
 * @param {import('./step.js').Step[]} incoming
 * @returns {import('./step.js').Step[]}
 */
export function mergeSteps(existing, incoming) {
  const replaced = new Set(incoming.map((step) => step.activity || ''));
  const kept = existing.filter((step) => !replaced.has(step.activity || ''));
  return [...kept, ...incoming];
}
