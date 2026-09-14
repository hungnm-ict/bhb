import { DEFAULT_COLOR_TOLERANCE } from '../core/constants.js';

/**
 * Rules carried over from bh-scripts, where they were proven in play.
 *
 * Their coordinates were captured on the author's macOS canvas, whose
 * framebuffer is pinned to a fixed minimum size. That size is not recorded
 * anywhere, so these points cannot be scaled yet and are treated as absolute.
 * Set `BUILTIN_CAPTURE_BUFFER` once measured on a known-good session and they
 * become portable like any captured rule.
 *
 * @type {{ width: number, height: number } | null}
 */
export const BUILTIN_CAPTURE_BUFFER = null;

/** @param {{x: number, y: number, hex?: string}} point */
function point(p) {
  return BUILTIN_CAPTURE_BUFFER
    ? { ...p, bw: BUILTIN_CAPTURE_BUFFER.width, bh: BUILTIN_CAPTURE_BUFFER.height }
    : { ...p };
}

/** Green "Rerun" button; two shades cover the idle and hover states. */
export const RERUN_RULES = [
  {
    id: 'builtin-rerun',
    label: 'Rerun',
    points: [point({ x: 410, y: 62, hex: '#a6d339' }), point({ x: 410, y: 62, hex: '#cbf067' })],
    hex: '#a6d339',
    tolerance: DEFAULT_COLOR_TOLERANCE,
    enabled: true,
  },
];

export const WORLD_BOSS_RULES = [
  {
    id: 'builtin-wb-start',
    label: 'Ready/Start',
    points: [point({ x: 388, y: 66 })],
    hex: '#0a62d0',
    tolerance: DEFAULT_COLOR_TOLERANCE,
    enabled: true,
  },
  {
    id: 'builtin-wb-yes',
    label: 'Yes',
    points: [point({ x: 356, y: 208 })],
    hex: '#9cd01f',
    tolerance: DEFAULT_COLOR_TOLERANCE,
    enabled: true,
  },
  {
    id: 'builtin-wb-regroup',
    label: 'Regroup',
    points: [
      point({ x: 446, y: 58 }),
      point({ x: 442, y: 50 }),
      point({ x: 594, y: 40, hex: '#89b516' }),
      point({ x: 492, y: 56 }),
    ],
    hex: '#9cd01f',
    tolerance: DEFAULT_COLOR_TOLERANCE,
    enabled: true,
  },
];
