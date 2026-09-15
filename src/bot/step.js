import { DEFAULT_COLOR_TOLERANCE } from '../core/constants.js';
import { isRegionPoint } from '../core/region.js';

/**
 * A step is "when this colour appears at this spot, click there".
 *
 * Upstream had two incompatible shapes — a flat `{x, y, hex}` for script steps
 * and a `{points: [...]}` for World Boss steps — which forced every consumer to
 * branch. Here there is one shape: a step owns a list of candidate points and
 * the first one that matches is clicked. A single-point step is just a list of
 * one.
 *
 * @typedef {object} StepPoint
 * @property {number} x  buffer space, bottom-left origin
 * @property {number} y
 * @property {number} [bw] framebuffer width at capture time
 * @property {number} [bh] framebuffer height at capture time
 * @property {string} [hex] overrides the step's colour for this point
 * @property {number} [w] region width; a point with `samples` is matched as one
 * @property {number} [h]
 * @property {import('../core/region.js').Sample[]} [samples]
 *
 * @typedef {object} Step
 * @property {string} id
 * @property {string} label
 * @property {StepPoint[]} points
 * @property {string | null} hex  null while awaiting colour capture
 * @property {number} tolerance
 * @property {boolean} enabled
 * @property {string[]} [screens] screen ids this may fire on; empty means any
 * @property {string | null} [activity] Run-All queue slot; null is the Script set
 */

/** @returns {string} */
export function createStepId() {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @param {Partial<Step>} [overrides]
 * @returns {Step}
 */
export function createStep(overrides = {}) {
  return {
    id: createStepId(),
    label: '',
    points: [],
    hex: null,
    tolerance: DEFAULT_COLOR_TOLERANCE,
    enabled: true,
    screens: [],
    activity: null,
    /**
     * Seconds to sit still after this step clicks.
     *
     * A dungeon run takes a minute; polling three times a second through it
     * reads the same frame over and over. This is what the hard-coded Re-run
     * mode used to do after clicking, kept as a property of the step that
     * starts the fight rather than a mode of its own.
     */
    restSec: 0,
    ...overrides,
  };
}

/**
 * A step is only actionable once it has somewhere to look and a colour to
 * expect there. A region point carries its own colours, so it needs no `hex`.
 */
export function isStepReady(step) {
  if (!step.enabled || step.points.length === 0) {
    return false;
  }
  return Boolean(step.hex) || step.points.every(isRegionPoint);
}

/** The colour to match for a given point — the point's own wins. */
export function colorForPoint(step, point) {
  return point.hex || step.hex;
}
