/**
 * Seedable PRNG (mulberry32) so rooms, drops and tests are reproducible.
 * @param {number} seed
 * @returns {() => number} returns floats in [0, 1)
 * @example const rnd = createRng(42); rnd(); // 0.6011...
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash a string into a 32-bit seed (room ids → stable layouts).
 * @param {string} text
 * @returns {number}
 */
export function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Integer in [min, max] inclusive.
 * @param {() => number} rnd
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randInt(rnd, min, max) {
  return min + Math.floor(rnd() * (max - min + 1));
}
