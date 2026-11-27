// What the hero can do, derived from what was collected. Pure: shared by the
// game (gates, form switching) and by the world-completion test.
import { BOSS_SEALS, LINKS, ROOMS } from './map.js';

/**
 * Traversal powers available when the hero may switch to any unlocked form.
 * @param {{forms: string[], relics: string[], seals: string[]}} owned
 * @returns {{dash: boolean, doubleJump: boolean, bolt: boolean, slide: boolean, seals: boolean}}
 * @example powersOf({forms: ['pawn', 'rook'], relics: [], seals: []}).dash === true
 */
export function powersOf(owned) {
  const has = (form) => owned.forms.includes(form) || owned.forms.includes('queen');
  return {
    dash: has('rook'),
    doubleJump: has('knight'),
    bolt: has('bishop'),
    slide: owned.relics.includes('slide'),
    seals: BOSS_SEALS.every((s) => owned.seals.includes(s)),
  };
}

const GATE_POWER = { rook: 'dash', knight: 'doubleJump', bishop: 'bolt', slide: 'slide', seals: 'seals' };

/**
 * Whether a gated link is open for these powers.
 * @param {string|null} gate
 * @param {ReturnType<typeof powersOf>} powers
 */
export function gateOpen(gate, powers) {
  return !gate || Boolean(powers[GATE_POWER[gate]]);
}

/**
 * Apply a pickup to the owned record (returns a new record).
 * @param {{forms: string[], relics: string[], seals: string[], shards: number, crystals: number}} owned
 * @param {string} item rook|knight|bishop|queen|slide|shard|crystal
 */
export function collect(owned, item) {
  const next = { ...owned, forms: [...owned.forms], relics: [...owned.relics], seals: [...owned.seals] };
  if (['rook', 'knight', 'bishop', 'queen'].includes(item)) next.forms.push(item);
  else if (item === 'slide') next.relics.push(item);
  else if (item === 'shard') next.shards += 1;
  else if (item === 'crystal') next.crystals += 1;
  else throw new Error(`unknown item "${item}" (expected a form, slide, shard or crystal)`);
  return next;
}

/** Fresh record for a new game. */
export function newOwned() {
  return { forms: ['pawn'], relics: [], seals: [], shards: 0, crystals: 0 };
}

/**
 * Rooms reachable from `from` through open links.
 * @returns {Set<string>}
 */
export function reachableRooms(from, powers) {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const id = queue.shift();
    for (const [a, b, gate] of LINKS) {
      const other = a === id ? b : b === id ? a : null;
      if (other && !seen.has(other) && gateOpen(gate, powers)) { seen.add(other); queue.push(other); }
    }
  }
  return seen;
}

/** All room ids (for map completion %). */
export const ROOM_IDS = ROOMS.map((r) => r.id);
