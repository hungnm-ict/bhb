import { StepKind } from '../bot/step.js';
import { isRegionPoint } from './region.js';

/**
 * One block of text that says what was set up and what happened.
 *
 * A step that will not fire is silent, and asking its owner what they see
 * costs a round trip each time. This is the whole predicament at once: the
 * build, the switches, the steps with what each is looking for, and the log
 * in the order it happened.
 *
 * Nothing here leaves the machine on its own — the user copies it and decides
 * who reads it — but a webhook is still a credential, so only whether one is
 * set is reported, never what it is.
 */

/** A short clock, since the date is carried once at the top. */
function clock(at) {
  const when = new Date(at);
  const pad = (value) => String(value).padStart(2, '0');
  return `${pad(when.getHours())}:${pad(when.getMinutes())}:${pad(when.getSeconds())}`;
}

function describeMinutes(ms) {
  const minutes = Math.round((Number(ms) || 0) / 60000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

/** Where a step looks, in the shape it stores. */
function describePoint(point) {
  if (isRegionPoint(point)) {
    return `${point.x},${point.y} ${point.w}×${point.h}`;
  }
  return `${point.x},${point.y}`;
}

function describeStep(step, position) {
  const parts = [`${position}. ${step.label || step.id}`];

  if (step.kind === StepKind.COUNT) {
    parts.push(`count ${step.countTo || 0}`, `cap ${step.countCap || 0}s`);
  } else if (step.kind === StepKind.WAIT) {
    parts.push(`wait ≤${step.maxMatches || 0}`);
  } else if (step.endsRun) {
    parts.push('click, ends run');
  } else if (step.optional) {
    parts.push('click if present');
  } else {
    parts.push('click');
  }

  parts.push(step.activity || 'loose');
  if (step.hex) {
    parts.push(step.hex);
  }
  parts.push(`tol ${step.tolerance}`);
  if (Number(step.restSec) > 0) {
    parts.push(`rest ${step.restSec}s`);
  }
  if (!step.enabled) {
    parts.push('OFF');
  }

  const places = (step.points || []).map(describePoint).join(' | ');
  return `  ${parts.join('  ·  ')}\n     ${places || 'nothing captured'}`;
}

function describeLogEntry(entry) {
  const what = entry.label || entry.kind;
  const where = entry.point ? `  @${entry.point.x},${entry.point.y}` : '';
  return `  ${clock(entry.at)}  ${entry.kind.padEnd(8)} ${what}${where}`;
}

/**
 * @param {object} input
 * @param {string} input.version
 * @param {object} input.settings
 * @param {{ width: number, height: number, clientWidth: number, clientHeight: number } | null} input.canvas
 * @param {object} input.stats
 * @param {import('../bot/activity.js').Activity[]} input.activities
 * @param {import('../bot/step.js').Step[]} input.steps
 * @param {object[]} input.log newest first, as the store keeps it
 * @returns {string}
 */
export function buildReport(input) {
  const settings = input.settings || {};
  const lock = settings.canvasLock || {};
  const notify = settings.notify || {};
  const stats = input.stats || {};
  const canvas = input.canvas;

  const lines = [`BHB v${input.version}  ·  ${new Date().toISOString()}`, ''];

  lines.push('SETUP');
  lines.push(
    `  canvas       ${canvas ? `${canvas.width}×${canvas.height} → ${Math.round(canvas.clientWidth)}×${Math.round(canvas.clientHeight)}` : 'none'}`
  );
  lines.push(`  scale mode   ${settings.scaleMode}`);
  lines.push(
    `  canvas lock  ${lock.enabled ? `on, ${lock.width}×${lock.height}` : 'off'}`
  );
  lines.push(`  watchdog     ${settings.watchdog ? 'on' : 'off'}`);
  lines.push(`  keep alive   ${settings.keepAlive ? 'on' : 'off'}`);
  lines.push(`  frames       ${settings.multiplyFrames ? 'multiplied' : 'plain'}`);
  // Whether, never what: a webhook is a credential.
  lines.push(
    `  alerts       ${notify.enabled ? 'on' : 'off'}, channel ${notify.discordWebhook || notify.telegramToken ? 'set' : 'none'}`
  );
  lines.push('');

  lines.push('SESSION');
  lines.push(`  running      ${describeMinutes(stats.runningMs)}`);
  lines.push(`  clicks       ${stats.clicks || 0}`);
  lines.push(`  resyncs      ${stats.resyncs || 0}`);
  lines.push(`  hangs        ${stats.hangs || 0}`);
  lines.push(`  queue rounds ${stats.rounds || 0}`);
  lines.push('');

  const activities = input.activities || [];
  lines.push(`QUEUE (${activities.filter((one) => one.enabled).length} on)`);
  for (const activity of activities) {
    lines.push(`  ${activity.enabled ? '✓' : '·'} ${activity.id}  ${activity.name}`);
  }
  if (activities.length === 0) {
    lines.push('  none');
  }
  lines.push('');

  const steps = input.steps || [];
  lines.push(`STEPS (${steps.length})`);
  for (const [index, step] of steps.entries()) {
    lines.push(describeStep(step, index + 1));
  }
  if (steps.length === 0) {
    lines.push('  none');
  }
  lines.push('');

  const log = input.log || [];
  lines.push(`LOG (${log.length}, oldest first)`);
  // The store keeps it newest first, for reading; a report is read forwards.
  for (const entry of [...log].reverse()) {
    lines.push(describeLogEntry(entry));
  }
  if (log.length === 0) {
    lines.push('  none');
  }

  return lines.join('\n');
}
