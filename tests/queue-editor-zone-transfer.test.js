/**
 * Moving click zones to another install: export to JSON, import back,
 * matched by activity id rather than position.
 */
import { describe, it, expect } from 'vitest';
import { createQueueEditor } from '../src/bot/queue-editor.js';

function editorFor(activities) {
  return createQueueEditor({ getActivities: () => activities, persist: () => {} });
}

const ZONE = { x: 10, y: 20, w: 30, h: 40, bw: 800, bh: 600 };

describe('exportZones / importZones', () => {
  it('exports only the activities that have a zone drawn', () => {
    const activities = [
      { id: 'raid', name: 'Raid', clickZone: ZONE },
      { id: 'pvp', name: 'PVP' },
    ];

    const json = editorFor(activities).exportZones();

    expect(JSON.parse(json)).toEqual([{ id: 'raid', clickZone: ZONE }]);
  });

  it('applies an export onto a different install by activity id', () => {
    const json = editorFor([{ id: 'raid', name: 'Raid', clickZone: ZONE }]).exportZones();

    const target = [{ id: 'raid', name: 'Raid' }, { id: 'pvp', name: 'PVP' }];
    const applied = editorFor(target).importZones(json);

    expect(applied).toBe(1);
    expect(target[0].clickZone).toEqual(ZONE);
    expect(target[1].clickZone).toBeUndefined();
  });

  it('skips an id the target install has no activity for', () => {
    const json = JSON.stringify([{ id: 'ghost-activity', clickZone: ZONE }]);
    const target = [{ id: 'raid', name: 'Raid' }];

    const applied = editorFor(target).importZones(json);

    expect(applied).toBe(0);
    expect(target[0].clickZone).toBeUndefined();
  });

  it('rejects anything that is not a JSON array', () => {
    const target = [{ id: 'raid', name: 'Raid' }];
    expect(() => editorFor(target).importZones('{"not":"an array"}')).toThrow();
  });
});
