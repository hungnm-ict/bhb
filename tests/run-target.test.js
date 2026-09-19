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
import { renderTasksTab, runChooserIsOpen } from '../src/ui/panel/tasks.js';

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

describe('the mode picker', () => {
  it('holds off the half-second rebuild while its list is open', () => {
    const tab = renderTasksTab({
      getEngineState: () => ({ activeTask: null, round: 0, remainingMs: 0, activity: null }),
      getSteps: () => [],
      getActivities: () => activities,
      getRunTarget: () => 'script',
      setRunTarget: () => {},
      runSelected: () => {},
      refresh: () => {},
    });
    document.body.append(tab);
    const chooser = tab.querySelector('select');

    expect(runChooserIsOpen(), 'nothing open yet').toBe(false);
    chooser.focus();
    expect(runChooserIsOpen()).toBe(true);
  });
});
