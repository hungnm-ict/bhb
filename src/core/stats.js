import { STORAGE_KEY_STATS } from './constants.js';
import { realNow } from './timers.js';

/**
 * Session counters.
 *
 * The engine already announces everything worth counting, so this folds its
 * `action` events rather than growing a second set of hooks inside the loop.
 *
 * Counters are persisted because the watchdog reloads the page: a night of
 * farming that resets its own totals every time the game hangs is a night of
 * farming nobody can read afterwards. `reset` is the only thing that clears
 * them — a session ends when the user says it does.
 *
 * @typedef {object} ActivityStat
 * @property {string} name
 * @property {number} clicks
 * @property {number} visits times Run-All switched to it
 * @property {number} spent times it reported out of resources
 *
 * @typedef {object} StatsSnapshot
 * @property {number} startedAt
 * @property {number} clicks
 * @property {number} rounds highest Run-All round reached
 * @property {number} resyncs
 * @property {number} hangs
 * @property {number} drops screens flagged `notify` that were seen
 * @property {number} runningMs total time with a task switched on
 * @property {Record<string, ActivityStat>} activities
 */

function emptyStats(at) {
  return {
    startedAt: at,
    clicks: 0,
    rounds: 0,
    resyncs: 0,
    hangs: 0,
    drops: 0,
    runningMs: 0,
    activities: {},
  };
}

/** A stored blob is user-editable and version-skewed; missing keys start at 0. */
function normalise(candidate, at) {
  const base = emptyStats(at);
  if (!candidate || typeof candidate !== 'object') {
    return base;
  }

  for (const key of Object.keys(base)) {
    if (key === 'activities') {
      continue;
    }
    if (typeof candidate[key] === 'number' && Number.isFinite(candidate[key])) {
      base[key] = candidate[key];
    }
  }

  if (candidate.activities && typeof candidate.activities === 'object') {
    for (const [id, entry] of Object.entries(candidate.activities)) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      base.activities[id] = {
        name: typeof entry.name === 'string' ? entry.name : id,
        clicks: Number(entry.clicks) || 0,
        visits: Number(entry.visits) || 0,
        spent: Number(entry.spent) || 0,
      };
    }
  }

  return base;
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('[BHB] could not read stats', error);
    return null;
  }
}

/**
 * @param {object} [deps]
 * @param {() => number} [deps.now]
 * @param {boolean} [deps.persist] false in tests, so counting needs no storage
 */
export function createStats(deps = {}) {
  const now = deps.now || realNow;
  const shouldPersist = deps.persist !== false;

  let stats = normalise(shouldPersist ? readStored() : null, now());
  /** When the current task started, or null while nothing is running. */
  let runningSince = null;
  /** The activity clicks are credited to; Run-All announces it, tasks do not. */
  let currentActivity = null;

  function save() {
    if (!shouldPersist) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch (error) {
      console.warn('[BHB] could not write stats', error);
    }
  }

  function activityEntry(id, name) {
    if (!stats.activities[id]) {
      stats.activities[id] = { name: name || id, clicks: 0, visits: 0, spent: 0 };
    } else if (name) {
      stats.activities[id].name = name;
    }
    return stats.activities[id];
  }

  /** Close the open running stretch, so `runningMs` is never mid-count. */
  function settleRunning(at) {
    if (runningSince === null) {
      return;
    }
    stats.runningMs += Math.max(0, at - runningSince);
    runningSince = null;
  }

  /**
   * Fold one engine action event.
   *
   * @param {{ kind: string, at?: number, started?: boolean, label?: string,
   *   activityId?: string, why?: string, round?: number }} entry
   */
  function record(entry) {
    if (!entry || typeof entry.kind !== 'string') {
      return;
    }
    const at = typeof entry.at === 'number' ? entry.at : now();

    if (entry.kind === 'task') {
      if (entry.started) {
        runningSince = at;
      } else {
        settleRunning(at);
        currentActivity = null;
      }
    } else if (entry.kind === 'click') {
      stats.clicks += 1;
      if (currentActivity) {
        activityEntry(currentActivity.id, currentActivity.name).clicks += 1;
      }
    } else if (entry.kind === 'activity') {
      currentActivity = { id: entry.activityId || entry.label, name: entry.label };
      const record_ = activityEntry(currentActivity.id, currentActivity.name);
      record_.visits += 1;
      if (entry.why === 'spent') {
        // `why` describes the activity being *left*, which is the one that ran
        // dry — never the one this event is announcing.
        if (entry.spentId) {
          activityEntry(entry.spentId, entry.spentName).spent += 1;
        }
      }
    } else if (entry.kind === 'resource') {
      if (currentActivity) {
        activityEntry(currentActivity.id, currentActivity.name).spent += 1;
      }
    } else if (entry.kind === 'resync') {
      stats.resyncs += 1;
    } else if (entry.kind === 'hang') {
      stats.hangs += 1;
    } else if (entry.kind === 'notify') {
      stats.drops += 1;
    }

    if (typeof entry.round === 'number' && entry.round > stats.rounds) {
      stats.rounds = entry.round;
    }

    save();
  }

  /** @returns {StatsSnapshot} including the stretch still being timed */
  function snapshot() {
    const live = runningSince === null ? 0 : Math.max(0, now() - runningSince);
    return {
      ...stats,
      runningMs: stats.runningMs + live,
      activities: { ...stats.activities },
    };
  }

  function reset() {
    stats = emptyStats(now());
    runningSince = runningSince === null ? null : now();
    currentActivity = null;
    save();
  }

  return { record, snapshot, reset };
}

/** `1h 04m` / `4m 12s` — a session is read at a glance, not to the second. */
export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}
