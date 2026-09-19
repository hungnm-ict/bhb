/**
 * What the Run control starts.
 *
 * The target is stored as a plain string — a task id or an activity id — so a
 * deleted activity has to fall back rather than start nothing at all.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { resolveRunTarget, TaskId } from '../src/core/engine.js';
import { renderTasksTab } from '../src/ui/panel/tasks.js';

const activities = [{ id: 'wb', name: 'World Boss' }];

describe('the Run target', () => {
  it('runs the loose Custom set by default', () => {
    expect(resolveRunTarget(null, activities)).toEqual({ taskId: TaskId.SCRIPT, activityId: null });
  });

  it('runs one activity on its own', () => {
    expect(resolveRunTarget('wb', activities)).toEqual({ taskId: TaskId.SOLO, activityId: 'wb' });
  });

  it('runs the whole queue', () => {
    expect(resolveRunTarget(TaskId.RUN_ALL, activities)).toEqual({
      taskId: TaskId.RUN_ALL,
      activityId: null,
    });
  });

  it('falls back to Custom when the activity is gone', () => {
    expect(resolveRunTarget('deleted', activities)).toEqual({
      taskId: TaskId.SCRIPT,
      activityId: null,
    });
  });
});

describe('the Run button', () => {
  it('is locked, and says why, when nothing is tagged to the chosen mode', () => {
    let started = 0;
    const tab = renderTasksTab({
      getEngineState: () => ({ activeTask: null, round: 0, remainingMs: 0, activity: null }),
      getSteps: () => [],
      getActivities: () => activities,
      getRunTarget: () => 'wb',
      setRunTarget: () => {},
      runSelected: () => { started += 1; },
      refresh: () => {},
    });

    tab.querySelector('.bhb-task--tile').click();

    expect(started, 'a mode with no steps cannot start').toBe(0);
    expect(tab.querySelector('.bhb-note--warn'), 'the reason is said in words').toBeTruthy();
  });

  it('says nothing when the chosen mode is ready', () => {
    const tab = renderTasksTab({
      getEngineState: () => ({ activeTask: null, round: 0, remainingMs: 0, activity: null }),
      getSteps: () => [{ id: 's', activity: 'wb', points: [], enabled: true }],
      getActivities: () => activities,
      getRunTarget: () => 'wb',
      setRunTarget: () => {},
      runSelected: () => {},
      refresh: () => {},
    });

    expect(tab.querySelector('.bhb-note--warn')).toBe(null);
  });
});
