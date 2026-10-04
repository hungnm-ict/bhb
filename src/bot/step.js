import { DEFAULT_COLOR_TOLERANCE, AUTO_STOP_TIMEOUT } from '../core/constants.js';
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
 * @property {boolean} [perSlot] read this rectangle once per party seat, not
 *   once: a team mate keeps their face when they change rows
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

/**
 * Which way round a wait step reads its places.
 *
 * `GONE` is the original and the default: hold while the colour is there,
 * which is how "wait until the party fills" is said, the empty seat's INVITE
 * button being the colour. `PRESENT` is the mirror, and it is the only way to
 * say "wait until this particular team mate turns up" — their face is the
 * colour, and its arrival is the condition.
 */
export const WaitFor = Object.freeze({
  GONE: 'gone',
  PRESENT: 'present',
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
     * Whether that threshold is a ceiling to fall under or a floor to reach.
     *
     * A floor of zero would let every wait through at once, so `PRESENT`
     * reads a threshold of zero as one: the plain meaning of "wait for them".
     */
    waitFor: WaitFor.GONE,
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
    /**
     * Set the game's speed as this step fires, or 0 to leave it alone.
     *
     * A battle is worth running at 15x and the buttons around it are not: at
     * speed the quit sequence is three clicks into a game that has already
     * moved on. The step that leaves the battle turns the speed down with it,
     * and the step that starts the next one turns it back up.
     */
    speedTo: 0,
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
    /**
     * Learn this step's `restSec` from the fight it actually runs, instead
     * of it being typed in. Meaningless without a matching `endsTimer` step
     * in the same activity to say when the fight is over.
     */
    restAuto: false,
    /**
     * Clicking this step is the signal that the fight a `restAuto` step in
     * this same activity started is over. One per activity; see
     * `recordAutoRest` in `step-editor.js` for how the pair is kept to one.
     */
    endsTimer: false,
    /**
     * Hidden running estimate of the fight length, in seconds. Never shown
     * in the Steps tab — `restSec` is what the engine reads and what the
     * user sees; this is only the memory behind it.
     */
    restObserved: 0,
    /** The step's `speedTo` the last time `restObserved` was updated. A
     *  fight timed at one speed is not a sample of a fight at another. */
    restSpeedTo: 0,
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

/** Was this name given out by the capture button, rather than typed? */
export function isAutoLabel(label) {
  return AUTO_LABEL.test(label || '');
}

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

/**
 * The speed this step asks for, or null when it asks for nothing.
 *
 * @param {Step} step
 * @returns {number | null}
 */
export function speedForStep(step) {
  const asked = Number(step.speedTo) || 0;
  // Snapping to a real stop belongs to whoever sets it; this file stays free
  // of the DOM that the speed hack lives in.
  return asked > 0 ? asked : null;
}

/**
 * Has a wait step's condition been met?
 *
 * @param {Step} step
 * @param {number} matched how many of its places show their colour now
 * @returns {boolean}
 */
export function waitSatisfied(step, matched) {
  const threshold = Math.max(0, Math.round(Number(step.maxMatches) || 0));
  if (step.waitFor === WaitFor.PRESENT) {
    return matched >= Math.max(1, threshold);
  }
  return matched <= threshold;
}

/** Seconds a learned rest may never reach — past this it would be the
 *  auto-stop timing itself out, not a fight ending. */
export const REST_CEILING_SEC = Math.round(AUTO_STOP_TIMEOUT / 1000) - 10;

/** How much of the newest fight's length survives into the running estimate. */
const REST_EMA_WEIGHT = 0.3;

/** How much the learned number is padded, to absorb ordinary run-to-run
 *  variance without the bot waking into a fight still finishing. */
const REST_PAD = 1.15;

/**
 * Fold one measured fight into a `restAuto` step's learned duration.
 *
 * @param {{ restObserved: number, restSpeedTo: number }} step the two
 *   fields this reads off the step that was timed
 * @param {number} elapsedSec this run's measured fight length
 * @param {number} speedTo the step's current `speedTo`
 * @returns {{ restSec: number, restObserved: number, restSpeedTo: number } | null}
 *   null means the sample looked nothing like a normal fight and was
 *   thrown away rather than applied
 */
export function computeAutoRest(step, elapsedSec, speedTo) {
  if (elapsedSec > REST_CEILING_SEC) {
    return null;
  }
  // A fight timed at one speed says nothing about another: start fresh
  // rather than average two different things together.
  const observed =
    step.restSpeedTo !== speedTo
      ? elapsedSec
      : step.restObserved === 0
        ? elapsedSec
        : step.restObserved * (1 - REST_EMA_WEIGHT) + elapsedSec * REST_EMA_WEIGHT;
  return {
    restObserved: observed,
    restSpeedTo: speedTo,
    restSec: Math.min(REST_CEILING_SEC, Math.round(observed * REST_PAD)),
  };
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
