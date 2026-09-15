import { realSetInterval } from './timers.js';

/**
 * A heartbeat that survives an occluded window.
 *
 * Timers are the obvious way to poke a stalled frame loop, and they are also
 * throttled in exactly the situation that needs poking: a hidden or occluded
 * page has its timers clamped to roughly one per second. That is better than a
 * frozen game and far worse than a running one.
 *
 * The audio thread is not throttled. A ScriptProcessorNode connected to a
 * silent gain is pulled by the audio device at a steady rate no matter what
 * the compositor thinks of the window, so its callback makes a usable clock.
 * The node is deprecated and its replacement needs a module fetch a userscript
 * cannot rely on, so this is the version that works in a page we do not own.
 *
 * Both are installed: the timer is the floor, the audio clock is the ceiling.
 */

/** Samples per callback: 4096 at 48kHz is roughly 12 ticks a second. */
const BUFFER_SIZE = 4096;

/** The floor, for when audio is unavailable or still waiting for a gesture. */
const FALLBACK_MS = 100;

/**
 * @param {() => void} tick
 * @returns {{ audio: boolean }} whether the audio clock could be started
 */
export function installKeepAlive(tick) {
  realSetInterval(tick, FALLBACK_MS);

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return { audio: false };
  }

  try {
    const context = new AudioContextClass();
    const processor = context.createScriptProcessor(BUFFER_SIZE, 1, 1);
    const silence = context.createGain();

    silence.gain.value = 0;
    processor.onaudioprocess = () => tick();
    processor.connect(silence);
    silence.connect(context.destination);

    // Autoplay rules keep a fresh context suspended until the user does
    // something; the first key or click in the page is enough.
    if (context.state === 'suspended') {
      const resume = () => context.resume().catch(() => {});
      for (const type of ['pointerdown', 'keydown']) {
        window.addEventListener(type, resume, { once: true, capture: true });
      }
    }

    return { audio: true };
  } catch (error) {
    console.warn('[BHB] could not start the audio clock', error);
    return { audio: false };
  }
}
