import { getRenderTarget } from './canvas.js';
import { matchPoint, readRegion, resolveRect, isRegionPoint, regionsDiffer } from './region.js';
import { clickBufferPoint, dispatchKey } from './input.js';
import { getBufferSize } from './coords.js';
import { isStepReady, colorForPoint, StepKind, pointsByPlace } from '../bot/step.js';
import { detectScreen, stepAllowedOn } from '../bot/screen.js';
import { stepsForActivity, looseSteps } from '../bot/activity.js';
import { createEmitter } from './events.js';
import {
  realNow,
  realSetInterval,
  realClearInterval,
  realSetTimeout,
  realClearTimeout,
} from './timers.js';
import { nextPace, FIRST_PACE } from './pace.js';
import {
  BACKWARD_QUIET_MS,
  BACKWARD_STABLE_MS,
  COUNT_DEBOUNCE_MS,
  COUNT_POLL_MS,
  PANIC_AFTER_MS,
  PANIC_GAP_MS,
  PANIC_MAX_TRIES,
  PANIC_SWEEPS,
  SCRIPT_PACE_LADDER,
  INTERVAL_AUTO_STOP_CHECK,
  IDLE_ADVANCE_MS,
  AUTO_STOP_TIMEOUT,
} from './constants.js';

/**
 * The automation loop.
 *
 * One task runs at a time. A task polls on its own interval, walks its steps
 * in order, and clicks the first point whose colour matches — first match
 * wins, so step order encodes priority.
 *
 * All scheduling uses the real timers: the speed hack scales the *game*, and
 * a poll that sped up with it would just burn CPU re-reading the same frame.
 */

export const TaskId = Object.freeze({
  SCRIPT: 'script',
  SOLO: 'solo',
  RUN_ALL: 'runAll',
});

/**
 * What the Run control starts.
 *
 * Anything that is not one of the two task ids is an activity id, run on its
 * own — so a target survives an activity being renamed, and a deleted one
 * simply falls back to the Script set.
 *
 * @param {string | null} target
 * @param {{ id: string }[]} activities
 * @returns {{ taskId: string, activityId: string | null }}
 */
export function resolveRunTarget(target, activities = []) {
  if (target === TaskId.RUN_ALL) {
    return { taskId: TaskId.RUN_ALL, activityId: null };
  }
  if (target && target !== TaskId.SCRIPT && activities.some((one) => one.id === target)) {
    return { taskId: TaskId.SOLO, activityId: target };
  }
  return { taskId: TaskId.SCRIPT, activityId: null };
}

/**
 * @typedef {object} EngineDeps
 * @property {() => import('../bot/step.js').Step[]} getScriptSteps
 * @property {() => string} getScaleMode
 * @property {() => import('../bot/screen.js').Screen[]} [getScreens]
 * @property {() => import('../bot/activity.js').Activity[]} [getActivities]
 * @property {() => boolean} [shouldCloseAfterRound]
 * @property {() => void} [closeGame]
 * @property {() => boolean} [shouldRecoverFromHang]
 * @property {(task: string) => boolean} [recoverFromHang] false when it has given up
 */

export function createEngine(deps) {
  const emitter = createEmitter();

  const state = {
    /** @type {string | null} */
    activeTask: null,
    lastActionAt: 0,
    lastMessage: '',
    /** @type {string | null} id of the screen detected on the last tick */
    screen: null,
    /** @type {string | null} */
    screenName: null,
    /** @type {string | null} id of the activity Run-All is on */
    activity: null,
    /** @type {string | null} */
    activityName: null,
    /** @type {string | null} id of the step the runner is waiting for */
    expectedStepId: null,
    round: 0,
  };

  /** Activities already out of resources this round; cleared when it wraps. */
  let spent = new Set();
  let queueIndex = 0;
  /** When the current activity last did something; see `IDLE_ADVANCE_MS`. */
  let idleSince = 0;

  /** Where the runner is in the current step list. See `runSequence`. */
  const cursor = { key: null, index: 0, missingSince: 0 };

  /**
   * A count step's tally.
   *
   * `mark` is the picture of the wave being counted from, `previous` the one
   * read last tick. A change lands only when the current read matches
   * `previous` and differs from `mark`, so a number animating in is one wave
   * rather than three.
   */
  const tally = {
    stepId: null,
    count: 0,
    /** The region as it read last poll. */
    previous: null,
    /** Whether that poll found it unchanged — a wave is an edge off stillness. */
    wasStill: true,
    since: 0,
    lastCountAt: 0,
  };

  /**
   * Forget the tally, buffers and all.
   *
   * The step id alone cannot tell one visit from the next, so anything that
   * begins or ends a visit says so here: a lap, a stop, a start. A tally
   * carried across a stop would quit the next Invasion four waves early, and
   * its `since` would cap a run the moment it began.
   */
  function resetTally() {
    tally.stepId = null;
    tally.count = 0;
    tally.previous = null;
    tally.wasStill = true;
    tally.since = 0;
    tally.lastCountAt = 0;
  }

  /** Read by the pacer and the clocks; set while a count step is live. */
  let isCounting = false;
  let hasCounted = false;

  /**
   * What the runner knows about being lost.
   *
   * `candidate` is a step behind the cursor that keeps matching; going back on
   * it is the only move that cannot be justified by what is on screen, so it
   * has to earn it by holding still. `sweeps` counts full scans that found
   * nothing at all, which is a different predicament — the game is showing
   * something no step describes, and Escape is the only thing left to try.
   */
  const lost = {
    candidateId: null,
    stableSince: 0,
    sweeps: 0,
    since: 0,
    escapes: 0,
    lastEscapeAt: 0,
  };

  function foundOurWay() {
    lost.candidateId = null;
    lost.stableSince = 0;
    lost.sweeps = 0;
    lost.since = 0;
    lost.escapes = 0;
    lost.lastEscapeAt = 0;
  }

  /** When the current rest ends; the loop reads nothing until then. */
  let restingUntil = 0;

  /** The current gap between ticks. See `pace.js`. */
  let pace = FIRST_PACE;

  /** Set by `updateScreen`, read and cleared by the pacer on the same tick. */
  let screenJustChanged = false;

  let pollTimer = null;
  let autoStopTimer = null;


  const TASKS = {
    [TaskId.SCRIPT]: { getSteps: () => looseSteps(deps.getScriptSteps()) },
    [TaskId.SOLO]: { getSteps: soloSteps },
    [TaskId.RUN_ALL]: { getSteps: runAllRules },
  };

  /**
   * One activity on its own.
   *
   * This is what the hard-coded World Boss mode used to be, and it needs no
   * mode of its own: an activity the user tagged, run by itself, off the same
   * steps the queue would use.
   */
  function soloSteps() {
    return state.activity ? stepsForActivity(deps.getScriptSteps(), state.activity) : [];
  }

  function activities() {
    return (deps.getActivities ? deps.getActivities() : []).filter((a) => a.enabled);
  }

  /** The current activity's steps; the queue never sees the loose Script set. */
  function runAllRules() {
    const current = currentActivity();
    return current ? stepsForActivity(deps.getScriptSteps(), current.id) : [];
  }

  function currentActivity() {
    const queue = activities();
    return queue.length > 0 ? queue[queueIndex % queue.length] : null;
  }

  function setActivity(activity) {
    state.activity = activity ? activity.id : null;
    state.activityName = activity ? activity.name : null;
  }

  /**
   * Move to the next activity that still has something left this round.
   *
   * @param {string} why for the log: 'spent' or 'idle'
   */
  function advanceQueue(why) {
    const queue = activities();
    if (queue.length === 0) {
      return;
    }

    const leaving = currentActivity();
    if (why === 'spent' && leaving) {
      spent.add(leaving.id);
    }
    idleSince = realNow();
    cursor.key = null;

    for (let step = 1; step <= queue.length; step += 1) {
      const index = (queueIndex + step) % queue.length;

      if (index === 0) {
        // Everything ran dry inside one round. Spinning would teach the user
        // nothing, so stop and say which activity finished it off.
        if (spent.size >= queue.length) {
          report('resource', { label: leaving ? leaving.name : 'run all' });
          stop();
          setMessage('run all: everything is spent');
          return;
        }
        // The queue wrapped: resources regenerate, so everything is fair again.
        state.round += 1;
        spent = new Set();
        if (deps.shouldCloseAfterRound && deps.shouldCloseAfterRound() && deps.closeGame) {
          deps.closeGame();
        }
      }

      if (!spent.has(queue[index].id)) {
        queueIndex = index;
        setActivity(queue[index]);
        report('activity', {
          label: queue[index].name,
          activityId: queue[index].id,
          why,
          round: state.round,
          // Who ran dry is the activity being left, never the one announced.
          ...(why === 'spent' && leaving ? { spentId: leaving.id, spentName: leaving.name } : {}),
        });
        setMessage(`${queue[index].name}: ${why === 'spent' ? 'next' : 'nothing to do, next'}`);
        return;
      }
    }
  }

  /**
   * A discrete thing that happened, for the activity log.
   *
   * `lastMessage` is overwritten on every tick, so a log cannot be recovered
   * from it; these events are what the log tab is built from.
   *
   * @param {'click'|'busy'|'task'|'idle'|'screen'|'resource'|'activity'|'hang'|'resync'|'notify'} kind
   * @param {object} [detail]
   */
  function report(kind, detail = {}) {
    emitter.emit('action', { at: realNow(), kind, task: state.activeTask, ...detail });
  }

  function setMessage(message) {
    state.lastMessage = message;
    emitter.emit('change', getState());
  }

  function getState() {
    return {
      activeTask: state.activeTask,
      lastMessage: state.lastMessage,
      screen: state.screen,
      screenName: state.screenName,
      activity: state.activity,
      activityName: state.activityName,
      expectedStepId: state.expectedStepId,
      round: state.round,
      restingMs: Math.max(0, restingUntil - realNow()),
      spent: [...spent],
      remainingMs: state.activeTask
        ? Math.max(0, AUTO_STOP_TIMEOUT - (realNow() - state.lastActionAt))
        : 0,
    };
  }

  /**
   * Walk a step's points and click the first colour match.
   * @returns {{ step: object, clicked: boolean } | null}
   */
  /**
   * Try one step against the frame on screen.
   *
   * @returns {{ step: object, point: object, clicked: boolean } | null}
   */
  /**
   * Is this step's colour on screen right now?
   *
   * Separate from clicking, because a `wait` step asks the same question and
   * must not answer it with a click.
   *
   * @returns {{ x: number, y: number } | null}
   */
  /**
   * The closest a step came to matching this tick.
   *
   * "no match" alone cannot tell a step pointing at the wrong place from one
   * whose colour drifted a shade — and a shade is the common case, since a
   * button captured under a hover or over an animated background never comes
   * back quite the same.
   *
   * @type {{ label: string, drift: number, seen: string } | null}
   */
  let nearest = null;

  function matchStep(step, gl, screenId, buffer, scaleMode) {
    if (!isStepReady(step)) {
      return null;
    }
    // A count's region is a picture of itself, so it always matches. Left to
    // the free scan it would be clicked, and the sequence would walk on to
    // "quit the fight" having counted nothing.
    if (step.kind === StepKind.COUNT) {
      return null;
    }
    // Gated out before any pixel is read, which pays back the screen check.
    if (!stepAllowedOn(step, screenId)) {
      return null;
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
        return hit.point;
      }
      if (
        typeof hit.drift === 'number' &&
        (!nearest || hit.drift < nearest.drift)
      ) {
        nearest = { label: step.label || step.id, drift: hit.drift, seen: hit.seen };
      }
    }
    return null;
  }

  /** "no match", plus the shade it came closest on. */
  function describeMiss(who) {
    if (!nearest) {
      return `${who}: no match`;
    }
    return `${who}: no match — ${nearest.label} off by ${nearest.drift} (${nearest.seen})`;
  }

  /**
   * How many of a step's places still show their colour.
   *
   * @returns {number}
   */
  function countPlaces(step, gl, screenId, buffer, scaleMode) {
    if (!isStepReady(step) || !stepAllowedOn(step, screenId)) {
      return 0;
    }
    let seen = 0;
    for (const place of pointsByPlace(step)) {
      const matched = place.some(
        (storedPoint) =>
          matchPoint(
            gl,
            storedPoint,
            colorForPoint(step, storedPoint),
            buffer,
            scaleMode,
            step.tolerance
          ).matched
      );
      if (matched) {
        seen += 1;
      }
    }
    return seen;
  }

  /**
   * Watch a count step's region for this tick.
   *
   * @returns {'waiting' | 'done' | 'capped'}
   */
  function runCount(step, gl, buffer, scaleMode) {
    const watched = step.points.find(isRegionPoint);
    if (!watched) {
      return 'done';
    }

    if (tally.stepId !== step.id) {
      resetTally();
      tally.stepId = step.id;
      tally.since = realNow();
    }

    const goal = Math.max(0, Math.round(Number(step.countTo) || 0));
    if (tally.count >= goal) {
      return 'done';
    }

    const rect = resolveRect(watched, buffer, scaleMode);
    const reading = readRegion(gl, rect.x, rect.y, rect.w, rect.h);
    if (reading) {
      // A resized framebuffer reads as different at every pixel, which is a
      // new rectangle rather than a new wave. Start again from what is there.
      const hasResized =
        tally.previous &&
        (reading.w !== tally.previous.w || reading.h !== tally.previous.h);

      if (!tally.previous || hasResized) {
        tally.previous = reading;
        tally.wasStill = true;
      } else if (regionsDiffer(reading, tally.previous, step.tolerance)) {
        // A wave is the moment the region leaves stillness, not the moment it
        // comes to rest somewhere new: waiting for rest missed every wave that
        // ended before the rest could be confirmed, which at speed is most of
        // them. A number still animating is already moving, so it cannot start
        // a second wave — and the debounce covers a pause part-way through.
        const isNewWave =
          tally.wasStill && realNow() - tally.lastCountAt >= COUNT_DEBOUNCE_MS;
        if (isNewWave) {
          tally.count += 1;
          tally.lastCountAt = realNow();
          // The cap runs from the last wave, not from the first.
          tally.since = realNow();
          hasCounted = true;
        }
        tally.wasStill = false;
        tally.previous = reading;
      } else {
        tally.wasStill = true;
        tally.previous = reading;
      }
    }

    if (tally.count >= goal) {
      return 'done';
    }
    const cap = Number(step.countCap) || 0;
    if (cap > 0 && realNow() - tally.since >= cap * 1000) {
      return 'capped';
    }
    return 'waiting';
  }

  function tryStep(step, canvas, gl, screenId, buffer, scaleMode) {
    const point = matchStep(step, gl, screenId, buffer, scaleMode);
    if (!point) {
      return null;
    }
    return { step, point, clicked: clickBufferPoint(canvas, point) };
  }

  /** First match wins. Order is priority, and nothing is remembered. */
  function runSteps(steps, canvas, gl, screenId) {
    const buffer = getBufferSize(canvas);
    const scaleMode = deps.getScaleMode();

    for (let index = 0; index < steps.length; index += 1) {
      const hit = tryStep(steps[index], canvas, gl, screenId, buffer, scaleMode);
      if (hit) {
        return { ...hit, index };
      }
    }
    return null;
  }

  /**
   * The same scan without the click.
   *
   * Going back on a step has to be believed before it is acted on, and a scan
   * that clicks what it finds has already acted.
   */
  function findMatch(steps, gl, screenId, buffer, scaleMode) {
    for (let index = lastCheckpoint(steps); index < steps.length; index += 1) {
      const step = steps[index];
      // A wait holds the sequence and a count watches it; neither is something
      // to land on when looking for the way back.
      if (step.kind === StepKind.WAIT || step.kind === StepKind.COUNT) {
        continue;
      }
      const point = matchStep(step, gl, screenId, buffer, scaleMode);
      if (point) {
        return { step, point, index };
      }
    }
    return null;
  }

  /**
   * How far back the way back may go.
   *
   * A wait or a count is a checkpoint: getting past one cost real time, and
   * a step before it will often match for exactly the wrong reason. Turning
   * auto-battle off makes the turn-it-on step match again, so a runner that
   * could reach back past its count turned auto on, counted the same battle
   * over, and never once reached the button that quits.
   *
   * @returns {number} the first index the way back may consider
   */
  function lastCheckpoint(steps) {
    for (let index = Math.min(cursor.index, steps.length) - 1; index >= 0; index -= 1) {
      const kind = steps[index].kind;
      if (kind === StepKind.WAIT || kind === StepKind.COUNT) {
        return index + 1;
      }
    }
    return 0;
  }

  /**
   * Walk a list in order, and find the way back when the game does not.
   *
   * A list the user wrote is a sequence — open PVP, pick an opponent, accept —
   * and first-match-wins cannot express it: two buttons on one screen would
   * leave the runner clicking the first one forever. So the runner keeps its
   * place, and scans only from there.
   *
   * Which way it may move is decided by what can be proved. A button belonging
   * to a later step is on screen only because the game moved on, so forward is
   * taken at once. A step already done matching again proves nothing — it looks
   * the same whether the game went back or the screen being waited for is still
   * drawing — so backward is paid for in time: a quiet spell since the last
   * click, and the candidate holding still while it is watched.
   *
   * Nothing matching anywhere is a third thing, neither forward nor back. It
   * means the game is showing something the steps do not describe, and Escape
   * is all that is left to try.
   */
  function runSequence(steps, canvas, gl, screenId) {
    const key = sequenceKey();
    if (key === null || steps.length === 0) {
      return runSteps(steps, canvas, gl, screenId);
    }

    if (cursor.key !== key) {
      cursor.key = key;
      cursor.index = 0;
      cursor.missingSince = 0;
    }

    const buffer = getBufferSize(canvas);
    const scaleMode = deps.getScaleMode();

    // Forward from where the cursor stands, and no further round: a button of
    // a later screen being on screen is proof the game moved on, so the runner
    // moves with it. A step behind the cursor proves nothing, and is handled
    // below, on time rather than on sight.
    let blockedAt = null;

    for (let at = cursor.index % steps.length; at < steps.length; at += 1) {
      const expected = steps[at];
      cursor.index = at;
      state.expectedStepId = expected ? expected.id : null;
      const point = matchStep(expected, gl, screenId, buffer, scaleMode);

      // A wait or a count holds the sequence, and it may only do that on its
      // own turn. With a step before it still undone, the game has not reached
      // this screen — engaging here would count the waves of a battle that has
      // not started, and scanning past it would quit one that has.
      const isBlocking =
        expected.kind === StepKind.WAIT || expected.kind === StepKind.COUNT;
      if (isBlocking && blockedAt !== null) {
        break;
      }

      if (expected.kind === StepKind.WAIT) {
        // Counted, not spotted: "wait for a third player" is a count of empty
        // seats, and which seats they are is the game's business, not ours.
        const stillThere = countPlaces(expected, gl, screenId, buffer, scaleMode);
        if (stillThere > (expected.maxMatches || 0)) {
          cursor.missingSince = 0;
          setMessage(
            `${expected.label || expected.id}: waiting (${stillThere} left)`
          );
          return null;
        }
        continue;
      }

      // Capturing a step gives it a pixel; a count needs a rectangle. Without
      // this the sequence just stalls and then resyncs into clicking something
      // out of turn, with "no match" as the only explanation.
      if (
        expected.kind === StepKind.COUNT &&
        expected.enabled &&
        !expected.points.some(isRegionPoint)
      ) {
        isCounting = true;
        cursor.missingSince = 0;
        setMessage(`${expected.label || expected.id}: no box to watch — draw one`);
        return null;
      }

      if (expected.kind === StepKind.COUNT && isStepReady(expected)) {
        isCounting = true;
        const verdict = runCount(expected, gl, buffer, scaleMode);
        const label = expected.label || expected.id;
        const goal = Number(expected.countTo) || 0;
        if (verdict === 'waiting') {
          cursor.missingSince = 0;
          setMessage(`${label}: ${tally.count}/${goal}`);
          return null;
        }
        if (verdict === 'capped') {
          report('idle', { label });
          setMessage(`${label}: gave up after ${expected.countCap}s`);
        } else if (goal > 0) {
          setMessage(`${label}: ${tally.count}/${goal}`);
        }
        resetTally();
        continue;
      }

      if (point) {
        cursor.index = (at + 1) % steps.length;
        cursor.missingSince = 0;
        foundOurWay();
        return { step: expected, point, clicked: clickBufferPoint(canvas, point) };
      }

      // Nothing here. The cursor remembers the first step it could not do, so
      // that a forward scan which finds nothing leaves it where it was rather
      // than at the end of the list.
      if (blockedAt === null && !expected.optional && !expected.endsRun) {
        blockedAt = at;
      }
    }

    // Nothing ahead is waiting on anything, so the lap is over: back to the
    // top. A scan that only ever ran forward would otherwise reach the end of
    // the list and stay there.
    cursor.index = blockedAt === null ? 0 : blockedAt;
    state.expectedStepId = steps[cursor.index] ? steps[cursor.index].id : null;

    return lookBack(steps, canvas, gl, screenId, buffer, scaleMode);
  }

  /**
   * Nothing ahead. Either the game went back, or it is showing something no
   * step describes.
   */
  function lookBack(steps, canvas, gl, screenId, buffer, scaleMode) {
    if (!cursor.missingSince) {
      cursor.missingSince = realNow();
    }
    // Just clicked: the game has been given something to do, and has not had
    // time to do it. Suspecting oneself of being lost this early is impatience.
    if (realNow() - state.lastActionAt < BACKWARD_QUIET_MS) {
      return null;
    }

    const candidate = findMatch(steps, gl, screenId, buffer, scaleMode);
    if (!candidate) {
      lost.candidateId = null;
      lost.stableSince = 0;
      panic(canvas);
      return null;
    }

    lost.sweeps = 0;
    lost.since = 0;

    if (lost.candidateId !== candidate.step.id) {
      lost.candidateId = candidate.step.id;
      lost.stableSince = realNow();
    }
    if (realNow() - lost.stableSince < BACKWARD_STABLE_MS) {
      setMessage(`${candidate.step.label || candidate.step.id}: seen behind us, waiting to be sure`);
      return null;
    }

    report('resync', { label: candidate.step.label || candidate.step.id });
    cursor.index = (candidate.index + 1) % steps.length;
    cursor.missingSince = 0;
    foundOurWay();
    return { ...candidate, clicked: clickBufferPoint(canvas, candidate.point) };
  }

  /**
   * The way out of a screen nobody wrote a step for.
   *
   * Escape is what closes a dialog in this game — and also what leaves a
   * dungeon. Nothing matching for a while is exactly what a long fight looks
   * like, so this cannot tell the two apart and will sometimes quit a battle
   * that was going fine. Off unless asked for, and tried a few times before
   * being left to the watchdog.
   */
  function panic(canvas) {
    if (!deps.shouldTryEscape || !deps.shouldTryEscape()) {
      return;
    }
    if (!lost.since) {
      lost.since = realNow();
    }
    lost.sweeps += 1;

    const isLost = lost.sweeps >= PANIC_SWEEPS && realNow() - lost.since >= PANIC_AFTER_MS;
    if (!isLost || lost.escapes >= PANIC_MAX_TRIES) {
      return;
    }
    if (lost.lastEscapeAt && realNow() - lost.lastEscapeAt < PANIC_GAP_MS) {
      return;
    }

    lost.escapes += 1;
    lost.lastEscapeAt = realNow();
    dispatchKey(canvas, 'Escape');
    report('hang', { label: 'escape' });
    setMessage(`nothing on screen matches — tried Escape (${lost.escapes}/${PANIC_MAX_TRIES})`);
  }

  /**
   * Which list the cursor is currently walking, or null for the built-ins —
   * those are a handful of unordered reflexes, not a sequence.
   */
  function sequenceKey() {
    if (state.activeTask === TaskId.RUN_ALL || state.activeTask === TaskId.SOLO) {
      return state.activity;
    }
    if (state.activeTask === TaskId.SCRIPT) {
      return 'script';
    }
    return null;
  }

  /**
   * Where the game is, once per tick.
   *
   * @returns {import('../bot/screen.js').Screen | null}
   */
  function updateScreen(canvas, gl) {
    const screens = deps.getScreens ? deps.getScreens() : [];
    if (screens.length === 0) {
      return null;
    }

    const screen = detectScreen(gl, screens, getBufferSize(canvas), deps.getScaleMode());
    const id = screen ? screen.id : null;

    if (id !== state.screen) {
      screenJustChanged = true;
      state.screen = id;
      state.screenName = screen ? screen.name : null;
      report('screen', { label: screen ? screen.name || screen.id : 'unknown', screenId: id });
      // Only on the change: a drop popup sits there for several ticks, and one
      // sighting should not become a dozen alerts.
      if (screen && screen.notify) {
        report('notify', { label: screen.name || screen.id, screenId: id });
      }
    }

    return screen;
  }

  /** @returns {boolean} whether this tick clicked a step. */
  function tick() {
    if (!state.activeTask) {
      return false;
    }
    // Resting reads nothing on purpose: the fight this step started is still
    // running, and the frame has nothing new to say until it ends.
    if (restingUntil > realNow()) {
      return false;
    }
    const target = getRenderTarget();
    if (!target) {
      setMessage('waiting for game canvas');
      return false;
    }

    const screen = updateScreen(target.canvas, target.gl);
    // Under Run-All an exhausted resource is the cue to move on, not to stop.
    if (screen && screen.stopsTask && state.activeTask === TaskId.RUN_ALL) {
      advanceQueue('spent');
      return false;
    }
    if (screen && screen.stopsTask) {
      const stopped = state.activeTask;
      const label = screen.name || screen.id;
      report('resource', { label });
      stop();
      setMessage(`${stopped} stopped: ${label}`);
      return false;
    }

    const task = TASKS[state.activeTask];
    nearest = null;
    isCounting = false;
    hasCounted = false;
    const hit = runSequence(task.getSteps(), target.canvas, target.gl, state.screen);

    // A counted wave is the bot working, not the bot stuck: without this the
    // queue moves on after 12s and the run auto-stops after three minutes.
    if (hasCounted) {
      idleSince = realNow();
      state.lastActionAt = realNow();
    }

    if (!hit) {
      // A count step has already said where it is up to; "no match" would
      // overwrite that with a miss it is not having.
      if (isCounting) {
        return false;
      }
      if (state.activeTask === TaskId.RUN_ALL) {
        if (realNow() - idleSince >= IDLE_ADVANCE_MS) {
          advanceQueue('idle');
          return false;
        }
        setMessage(describeMiss(state.activityName || 'run all'));
        return false;
      }
      setMessage(describeMiss(state.activityName || state.activeTask));
      return false;
    }

    idleSince = realNow();

    if (hit.clicked) {
      state.lastActionAt = realNow();
      const rest = Number(hit.step.restSec) || 0;
      if (rest > 0) {
        restingUntil = realNow() + rest * 1000;
        setMessage(`${hit.step.label || hit.step.id}: resting ${rest}s`);
      }
    }

    report(hit.clicked ? 'click' : 'busy', {
      stepId: hit.step.id,
      label: hit.step.label || hit.step.id,
      point: hit.point,
    });
    setMessage(`${hit.step.label || hit.step.id} → ${hit.clicked ? 'click' : 'busy'}`);

    // The button that means the resource is spent. Same two endings as a
    // screen that says it: under the queue this activity is done and the next
    // one starts, on its own there is nothing to move to.
    if (hit.clicked && hit.step.endsRun) {
      const label = hit.step.label || hit.step.id;
      report('resource', { label });
      if (state.activeTask === TaskId.RUN_ALL) {
        advanceQueue('spent');
        return true;
      }
      const stopped = state.activeTask;
      stop();
      setMessage(`${stopped} stopped: ${label}`);
      return true;
    }

    return Boolean(hit.clicked);
  }

  /**
   * Book the next tick.
   *
   * Every mode paces itself the same way: 300ms straight after a click, then
   * one rung slower each time nothing matches. A fixed gap meant a button that
   * appeared right after a poll sat there untouched, and at 1× game speed —
   * where the fades run longest — most samples landed mid-animation and
   * matched nothing.
   */
  function schedulePoll() {
    const resting = restingUntil > realNow();
    // A wave at 15x can be shorter than the slowest rung, and a change seen
    // late is a change not seen at all.
    const delay = resting
      ? SCRIPT_PACE_LADDER[SCRIPT_PACE_LADDER.length - 1]
      : isCounting
        ? COUNT_POLL_MS
        : pace;

    pollTimer = realSetTimeout(() => {
      // Read before the tick: the rest this tick starts is not one it sat out.
      const wasResting = restingUntil > realNow();
      const clicked = tick();
      // A new screen is a new set of buttons to look for, so the back-off has
      // nothing to stand on: what it measures is a screen that has not changed.
      if (!wasResting) {
        pace = nextPace(pace, clicked || screenJustChanged || isCounting);
      }
      screenJustChanged = false;
      if (state.activeTask) {
        schedulePoll();
      }
    }, delay);
  }

  function clearInterval_(id) {
    if (id !== null && id !== undefined) {
      realClearInterval(id);
    }
  }

  function checkAutoStop() {
    if (!state.activeTask) {
      return;
    }
    if (realNow() - state.lastActionAt < AUTO_STOP_TIMEOUT) {
      return;
    }

    const stalled = state.activeTask;

    // The watchdog does not add a second timer; it changes what this one does.
    if (deps.shouldRecoverFromHang && deps.shouldRecoverFromHang() && deps.recoverFromHang) {
      report('hang', { label: stalled });
      setMessage(`${stalled} looks stuck — reloading`);
      if (deps.recoverFromHang(stalled)) {
        return;
      }
      stop();
      setMessage(`${stalled} stopped: reloading did not help`);
      return;
    }

    stop();
    setMessage(`${stalled} auto-stopped (idle ${AUTO_STOP_TIMEOUT / 60000}m)`);
  }

  /** @param {string} taskId */
  /**
   * @param {string} taskId
   * @param {string} [activityId] required by TaskId.SOLO; ignored otherwise
   */
  function start(taskId, activityId = null) {
    if (!TASKS[taskId]) {
      throw new Error(`unknown task: ${taskId}`);
    }
    if (state.activeTask) {
      stop();
    }

    state.activeTask = taskId;
    state.lastActionAt = realNow();
    restingUntil = 0;

    // Starting Run-All begins a clean round, at the top of the queue.
    spent = new Set();
    queueIndex = 0;
    idleSince = realNow();
    cursor.key = null;
    state.expectedStepId = null;
    state.round = taskId === TaskId.RUN_ALL ? 1 : 0;

    if (taskId === TaskId.SOLO) {
      const solo = (deps.getActivities ? deps.getActivities() : []).find(
        (activity) => activity.id === activityId
      );
      setActivity(solo || null);
    } else {
      setActivity(taskId === TaskId.RUN_ALL ? currentActivity() : null);
    }

    pace = FIRST_PACE;
    isCounting = false;
    resetTally();
    foundOurWay();
    schedulePoll();
    autoStopTimer = realSetInterval(checkAutoStop, INTERVAL_AUTO_STOP_CHECK);

    report('task', { started: true, label: taskId });
    setMessage(`${taskId} started`);
    tick();
  }

  function stop() {
    if (!state.activeTask) {
      return;
    }
    const stopped = state.activeTask;

    state.activeTask = null;
    restingUntil = 0;
    state.screen = null;
    state.screenName = null;
    state.expectedStepId = null;
    cursor.key = null;
    isCounting = false;
    resetTally();
    foundOurWay();
    setActivity(null);

    realClearTimeout(pollTimer);
    clearInterval_(autoStopTimer);
    pollTimer = autoStopTimer = null;

    report('task', { started: false, label: stopped });
    setMessage(`${stopped} stopped`);
  }

  /** Start the task, or stop it if it is the one already running. */
  function toggle(taskId) {
    if (state.activeTask === taskId) {
      stop();
    } else {
      start(taskId);
    }
  }

  return { start, stop, toggle, tick, checkIdle: checkAutoStop, getState, on: emitter.on, setMessage };
}
