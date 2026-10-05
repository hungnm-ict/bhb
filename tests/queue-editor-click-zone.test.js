/**
 * Capturing and clearing an activity's click zone.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let canvas;
vi.mock('../src/core/canvas.js', () => ({
  getCanvas: () => canvas,
}));

const { createQueueEditor } = await import('../src/bot/queue-editor.js');

beforeEach(() => {
  canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  canvas.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600,
  });
});

function editorFor(activities) {
  return createQueueEditor({ getActivities: () => activities, persist: () => {} });
}

describe('setClickZone', () => {
  it('stores a buffer-space rect, flipped to bottom-left origin, with the capture size', () => {
    const activities = [{ id: 'raid', name: 'Raid' }];
    const editor = editorFor(activities);

    // A 40x40 client-space drag starting 20px from the top.
    editor.setClickZone('raid', { left: 10, top: 20, width: 40, height: 40 });

    expect(activities[0].clickZone).toEqual({ x: 10, y: 540, w: 40, h: 40, bw: 800, bh: 600 });
  });

  it('clears the zone when handed null', () => {
    const activities = [{ id: 'raid', name: 'Raid', clickZone: { x: 0, y: 0, w: 1, h: 1 } }];
    const editor = editorFor(activities);

    editor.setClickZone('raid', null);

    expect(activities[0].clickZone).toBeNull();
  });

  it('does nothing for an activity id that does not exist', () => {
    const activities = [{ id: 'raid', name: 'Raid' }];
    const editor = editorFor(activities);

    expect(() => editor.setClickZone('missing', { left: 0, top: 0, width: 10, height: 10 })).not.toThrow();
    expect(activities[0].clickZone).toBeUndefined();
  });
});
