/**
 * The diagnostic report.
 *
 * Three rounds of guessing at one Invasion step is what this is for: a block
 * of text someone can paste, holding what was set up, what happened, and in
 * what order.
 */
import { describe, it, expect } from 'vitest';
import { buildReport } from '../src/core/report.js';
import { createStep, StepKind } from '../src/bot/step.js';

const BASE = {
  version: '0.31.6',
  settings: {
    scaleMode: 'scale',
    watchdog: true,
    keepAlive: true,
    multiplyFrames: true,
    canvasLock: { enabled: false, width: 800, height: 500 },
    notify: { enabled: false, discordWebhook: 'https://discord.com/api/secret' },
  },
  canvas: { width: 800, height: 500, clientWidth: 800, clientHeight: 500 },
  stats: { runningMs: 5000, clicks: 12, resyncs: 3, hangs: 1, rounds: 0, drops: 0 },
  activities: [{ id: 'invasion', name: 'Invasion', enabled: true }],
  steps: [
    createStep({
      label: 'auto on',
      activity: 'invasion',
      hex: '#ff0000',
      tolerance: 12,
      points: [{ x: 773, y: 271, bw: 800, bh: 500 }],
    }),
    createStep({
      label: 'waves',
      activity: 'invasion',
      kind: StepKind.COUNT,
      countTo: 7,
      countCap: 120,
      points: [{ x: 400, y: 460, w: 45, h: 30, bw: 800, bh: 500, samples: [{ dx: 0.5, dy: 0.5, hex: '#101010' }] }],
    }),
  ],
  log: [
    { at: 1_700_000_001_000, kind: 'click', label: 'auto on', point: { x: 773, y: 271 } },
    { at: 1_700_000_000_000, kind: 'task', label: 'solo', started: true },
  ],
};

describe('buildReport', () => {
  it('leads with the build, so nobody debugs the wrong one', () => {
    expect(buildReport(BASE).split('\n')[0]).toContain('0.31.6');
  });

  it('carries the steps, with what each one is looking for', () => {
    const report = buildReport(BASE);
    expect(report).toContain('auto on');
    expect(report).toContain('#ff0000');
    expect(report).toContain('773,271');
    expect(report).toContain('tol 12');
  });

  it('says what a count step is counting', () => {
    const report = buildReport(BASE);
    expect(report).toContain('count 7');
    expect(report).toContain('45×30');
  });

  it('puts the log oldest first, which is the order it happened in', () => {
    // The store keeps the newest at the top, for reading; this is read forwards.
    const log = buildReport(BASE).split('LOG (')[1];
    expect(log.indexOf('task')).toBeLessThan(log.indexOf('click'));
  });

  it('never carries a webhook out of the machine', () => {
    const report = buildReport(BASE);
    expect(report).not.toContain('secret');
    expect(report, 'but does say whether one is set').toContain('alerts');
  });

  it('survives a profile with nothing in it', () => {
    const bare = { ...BASE, steps: [], log: [], activities: [] };
    expect(() => buildReport(bare)).not.toThrow();
  });
});
