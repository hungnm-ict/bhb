import { DEFAULT_COLOR_TOLERANCE } from '../core/constants.js';
import { isRegionPoint } from '../core/region.js';

/**
 * A rule is "when this colour appears at this spot, click there".
 *
 * Upstream had two incompatible shapes — a flat `{x, y, hex}` for script rules
 * and a `{points: [...]}` for World Boss rules — which forced every consumer to
 * branch. Here there is one shape: a rule owns a list of candidate points and
 * the first one that matches is clicked. A single-point rule is just a list of
 * one.
 *
 * @typedef {object} RulePoint
 * @property {number} x  buffer space, bottom-left origin
 * @property {number} y
 * @property {number} [bw] framebuffer width at capture time
 * @property {number} [bh] framebuffer height at capture time
 * @property {string} [hex] overrides the rule's colour for this point
 * @property {number} [w] region width; a point with `samples` is matched as one
 * @property {number} [h]
 * @property {import('../core/region.js').Sample[]} [samples]
 *
 * @typedef {object} Rule
 * @property {string} id
 * @property {string} label
 * @property {RulePoint[]} points
 * @property {string | null} hex  null while awaiting colour capture
 * @property {number} tolerance
 * @property {boolean} enabled
 * @property {string[]} [screens] screen ids this may fire on; empty means any
 * @property {string | null} [activity] Run-All queue slot; null is the Script set
 */

/** @returns {string} */
export function createRuleId() {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @param {Partial<Rule>} [overrides]
 * @returns {Rule}
 */
export function createRule(overrides = {}) {
  return {
    id: createRuleId(),
    label: '',
    points: [],
    hex: null,
    tolerance: DEFAULT_COLOR_TOLERANCE,
    enabled: true,
    screens: [],
    activity: null,
    ...overrides,
  };
}

/**
 * A rule is only actionable once it has somewhere to look and a colour to
 * expect there. A region point carries its own colours, so it needs no `hex`.
 */
export function isRuleReady(rule) {
  if (!rule.enabled || rule.points.length === 0) {
    return false;
  }
  return Boolean(rule.hex) || rule.points.every(isRegionPoint);
}

/** The colour to match for a given point — the point's own wins. */
export function colorForPoint(rule, point) {
  return point.hex || rule.hex;
}
