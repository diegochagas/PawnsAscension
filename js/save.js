// Save games: a versioned JSON snapshot of progress. Storage is injected so
// tests can use an in-memory fake instead of localStorage.
import { newOwned } from './world/progress.js';
import { START_ROOM } from './world/map.js';

export const SAVE_KEY = 'pawns-ascension-v2';
export const SAVE_VERSION = 2;

/** A brand-new game state. */
export function newGame() {
  return {
    version: SAVE_VERSION,
    room: START_ROOM,
    respawn: START_ROOM, // last bonfire rested at: Continue and deaths start here
    owned: newOwned(),
    xp: 0,
    form: 'pawn',
    visited: [START_ROOM],
    taken: [],       // pickup ids already collected ("roomId:item")
    bosses: [],      // defeated boss ids
    bonfires: [],    // rooms with a lit bonfire (warp targets)
    playFrames: 0,
  };
}

/**
 * Validate and fill a loaded snapshot; rejects unknown versions.
 * @param {unknown} raw parsed JSON
 * @returns {ReturnType<typeof newGame>|null}
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== SAVE_VERSION) return null;
  const base = newGame();
  return { ...base, ...raw, owned: { ...base.owned, ...raw.owned } };
}

/**
 * Persist a game.
 * @param {{setItem: (k: string, v: string) => void}} storage
 * @param {ReturnType<typeof newGame>} game
 */
export function saveGame(storage, game) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(game));
    return true;
  } catch {
    return false; // private mode or quota: the game keeps running unsaved
  }
}

/**
 * Load a game, or null when missing/corrupt/old.
 * @param {{getItem: (k: string) => string|null}} storage
 */
export function loadGame(storage) {
  try {
    const text = storage.getItem(SAVE_KEY);
    return text ? migrate(JSON.parse(text)) : null;
  } catch {
    return null;
  }
}
