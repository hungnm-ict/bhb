/** Replaced by esbuild at build time; `dev` when running from source (tests). */
export const VERSION =
  typeof __BHB_VERSION__ === 'string' ? __BHB_VERSION__ : 'dev';

/** Storage keys. Bump the suffix only on a breaking schema change. */
export const STORAGE_KEY_PROFILES = 'bhb.profiles.v2';
export const STORAGE_KEY_SETTINGS = 'bhb.settings.v2';
/** Upstream's key, read once to migrate a user coming from bh-scripts. */
export const STORAGE_KEY_RESUME = 'bhb.resume.v1';
export const STORAGE_KEY_STATS = 'bhb.stats.v1';
export const STORAGE_KEY_LEGACY_RULES = 'bh_script_rules_v1';

/** Default per-channel RGB distance allowed when matching a colour. */
export const DEFAULT_COLOR_TOLERANCE = 15;

/** Poll intervals, in real milliseconds (never scaled by the speed hack). */
export const INTERVAL_RERUN_HUNT = 3000;
export const INTERVAL_RERUN_REST = 20000;
export const INTERVAL_WORLD_BOSS = 2000;
export const INTERVAL_SCRIPT = 3000;
export const INTERVAL_AUTO_STOP_CHECK = 5000;
export const INTERVAL_RUN_ALL = 1500;

/** Ticks with no match before Run-All gives up on an activity and moves on. */
export const IDLE_ADVANCE_TICKS = 8;

/**
 * Ticks the runner waits for the step it expects before it stops trusting its
 * place in the list and takes whatever fits the screen in front of it.
 */
export const RESYNC_AFTER_TICKS = 3;

/** Stop automation after this long with no successful click. */
export const AUTO_STOP_TIMEOUT = 3 * 60 * 1000;

/** A resume record older than this is a session the user walked away from. */
export const RESUME_MAX_AGE = 15 * 60 * 1000;

/** Time after the canvas appears before resuming — the game has to load. */
export const RESUME_DELAY = 45 * 1000;

/** Consecutive reloads with no click before the watchdog gives up. */
export const MAX_RELOADS = 3;

/** Debounce between synthetic clicks, so the game sees them as distinct. */
export const CLICK_LOCKOUT_MS = 200;
export const CLICK_HOVER_RESET_MS = 100;

/** Where the cursor is parked after a click, to clear any hover highlight. */
export const HOVER_RESET_POINT = { x: 5, y: 5 };

/** The speed slider's stops; anything set in between snaps to the nearest. */
export const SPEED_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 2, 3, 4, 5, 7, 10, 15, 20];

/** How long a dry run lingers on each step — fast enough not to bore, slow
 *  enough to follow. */
export const DRY_RUN_STEP_MS = 700;

/** Quiet window per alert kind, so a flapping screen cannot spam a channel. */
export const NOTIFY_COOLDOWN_MS = 60 * 1000;

/** JPEG quality for the attached canvas shot; a drop popup needs no more. */
export const NOTIFY_SHOT_QUALITY = 0.7;

/** Highest z-index, so overlays sit above the game canvas. */
export const Z_TOP = '2147483647';
