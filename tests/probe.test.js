import { describe, it, expect } from 'vitest';
import {
  createProbe,
  scoreProbe,
  normaliseProbes,
  ASPECT_EPSILON,
} from '../src/core/probe.js';

function probeAt(overrides = {}) {
  return createProbe({ x: 320, y: 200, bw: 640, bh: 400, hex: '#3a7fd5', ...overrides });
}

describe('createProbe', () => {
  it('keeps the framebuffer size it was captured at', () => {
    const probe = probeAt();
    expect(probe.bw).toBe(640);
    expect(probe.bh).toBe(400);
  });

  it('gives every probe an id of its own', () => {
    expect(probeAt().id).not.toBe(probeAt().id);
  });
});

describe('scoreProbe', () => {
  it('reports the scaled position under a smaller framebuffer', () => {
    const score = scoreProbe(probeAt(), { width: 480, height: 320 }, null, 10);
    expect(score.resolved).toEqual({ x: 240, y: 160 });
  });

  it('matches when the live colour is within tolerance', () => {
    const score = scoreProbe(
      probeAt(),
      { width: 480, height: 320 },
      { r: 0x3b, g: 0x7e, b: 0xd2 },
      10
    );
    expect(score.delta).toBe(3);
    expect(score.matches).toBe(true);
  });

  it('fails when the live colour is outside tolerance', () => {
    const score = scoreProbe(
      probeAt(),
      { width: 480, height: 320 },
      { r: 0x10, g: 0x10, b: 0x10 },
      10
    );
    expect(score.matches).toBe(false);
    expect(score.liveHex).toBe('#101010');
  });

  it('cannot judge a probe whose pixel could not be read', () => {
    const score = scoreProbe(probeAt(), { width: 480, height: 320 }, null, 10);
    expect(score.matches).toBe(null);
    expect(score.delta).toBe(null);
    expect(score.liveHex).toBe(null);
  });

  it('flags an aspect ratio that no longer matches the capture', () => {
    // 640x400 is 1.60; 480x320 is 1.50 — a letterbox would show up here first.
    const score = scoreProbe(probeAt(), { width: 480, height: 320 }, null, 10);
    expect(score.aspectChanged).toBe(true);
  });

  it('does not flag a framebuffer that only changed size', () => {
    const score = scoreProbe(probeAt(), { width: 1280, height: 800 }, null, 10);
    expect(score.aspectChanged).toBe(false);
  });

  it('tolerates floating point drift in the aspect comparison', () => {
    const probe = probeAt({ bw: 1920, bh: 1200 });
    const score = scoreProbe(probe, { width: 640, height: 400 }, null, 10);
    expect(score.aspectChanged).toBe(false);
    expect(ASPECT_EPSILON).toBeGreaterThan(0);
  });

  it('says the framebuffer is unchanged when it is', () => {
    const score = scoreProbe(probeAt(), { width: 640, height: 400 }, null, 10);
    expect(score.resized).toBe(false);
    expect(score.resolved).toEqual({ x: 320, y: 200 });
  });
});

describe('normaliseProbes', () => {
  it('drops anything that is not a usable probe', () => {
    const probes = normaliseProbes([
      null,
      { x: 1 },
      'nope',
      { id: 'p1', x: 10, y: 20, bw: 640, bh: 400, hex: '#ffffff' },
    ]);
    expect(probes).toHaveLength(1);
    expect(probes[0].id).toBe('p1');
  });

  it('returns an empty list for anything that is not a list', () => {
    expect(normaliseProbes(undefined)).toEqual([]);
    expect(normaliseProbes({})).toEqual([]);
  });

  it('gives an id to a probe that lost one in transit', () => {
    const probes = normaliseProbes([{ x: 10, y: 20, bw: 640, bh: 400, hex: '#ffffff' }]);
    expect(probes[0].id).toBeTruthy();
  });
});
