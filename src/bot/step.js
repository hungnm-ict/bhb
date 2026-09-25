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
/**
 * What a step does when its colour is on screen.
 *
 * `WAIT` is the one that is not a click: it holds the sequence while its colour
 * is present, which is how "wait until the party has three players" is said in
 * a language made of colours — the empty slot's INVITE button is the colour,
 * and its absence is the condition.
 */
export const StepKind = Object.freeze({
  CLICK: 'click',
  WAIT: 'wait',
  COUNT: 'count',
});

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
    kind: StepKind.CLICK,
    /**
     * For a wait step: how many of its points may still match before it lets
     * the sequence through. Waiting on four empty party slots with this at 2
     * is "wait until three players are here", whichever seats they took.
     */
    maxMatches: 0,
    /**
     * For a count step: how many times its region must settle at a new
     * picture before the sequence goes on. Seven is an Invasion's waves.
     */
    countTo: 0,
    /**
     * Seconds without a single change before the count gives up and moves on.
     *
     * Since the last change, not since the count began, so a slow battle is
     * never cut off part-way. Kept under the auto-stop on purpose: the two
     * clocks race, and the one that should win is the one that loses a lap
     * rather than the whole run.
     */
    countCap: 120,
    /** Skip instead of waiting when it does not match — a box already ticked. */
    optional: false,
    /**
     * Clicking this one means the resource is spent.
     *
     * A screen could already say so; a step could not, and capturing a whole
     * screen to express "the Play button went grey" is more work than the
     * fact deserves.
     */
    endsRun: false,
    ...overrides,
  };
}

/**
 * Names this file gave out, in either language. Anything else is the user's.
 *
 * Kept as a pattern rather than as a flag on the step: a profile written
 * before this existed has no flag, and the name is the only evidence there is.
 */
const AUTO_LABEL = /^(Step|Bước)\s+(\d+)$/;

/**
 * Renumber the names this file gave out so they match the row beside them.
 *
 * A profile with eight activities in it numbered every capture across the
 * whole list, so Invasion's first step was called "Step 41" while the row
 * said 1. Numbering is per activity and by position, and a name the user
 * typed is left exactly as it is — it still holds its place in the count, so
 * the number on a name always equals the number on its row.
 *
 * @param {Step[]} steps
 * @returns {boolean} whether anything changed
 */
export function renumberAutoLabels(steps) {
  const seen = new Map();
  let hasChanged = false;

  for (const step of steps) {
    const group = step.activity || '';
    const position = (seen.get(group) || 0) + 1;
    seen.set(group, position);

    const match = AUTO_LABEL.exec(step.label || '');
    if (!match) {
      continue;
    }
    const renamed = `${match[1]} ${position}`;
    if (renamed !== step.label) {
      step.label = renamed;
      hasChanged = true;
    }
  }

  return hasChanged;
}

/**
 * A step is only actionable once it has somewhere to look and a colour to
 * expect there. A region point carries its own colours, so it needs no `hex`.
 */
export function isStepReady(step) {
  if (!step.enabled || step.points.length === 0) {
    return false;
  }
  // A count reads a rectangle, so a lone pixel is nothing it can watch.
  if (step.kind === StepKind.COUNT) {
    return step.points.some(isRegionPoint);
  }
  return Boolean(step.hex) || step.points.every(isRegionPoint);
}

/** The colour to match for a given point — the point's own wins. */
export function colorForPoint(step, point) {
  return point.hex || step.hex;
}

/**
 * Points grouped by the place they look at.
 *
 * A capture stores two points at one spot — the resting colour and the hovered
 * one — so counting points would count one party slot twice. Counting places
 * is what the user means by "how many slots are still empty".
 *
 * @returns {Array<import('./step.js').StoredPoint[]>}
 */
export function pointsByPlace(step) {
  const places = new Map();
  for (const point of step.points) {
    const key = `${point.x},${point.y},${point.bw || 0},${point.bh || 0}`;
    const group = places.get(key);
    if (group) {
      group.push(point);
    } else {
      places.set(key, [point]);
    }
  }
  return [...places.values()];
}
