import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../js/config.js';

// survive.js imports the PlayScene chain (DOM-free at import time), so it loads in node.
const { waveEnemies } = await import('../js/scenes/survive.js');

test('waves grow, stay deterministic and use known enemies', () => {
  assert.deepEqual(waveEnemies(3), waveEnemies(3));
  assert.ok(waveEnemies(6).length > waveEnemies(1).length);
  assert.ok(waveEnemies(40).length <= 10);
  for (let w = 1; w < 20; w++) for (const type of waveEnemies(w)) assert.ok(ENEMIES[type], type);
});
