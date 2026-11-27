// Survive mode: the old wave game rebuilt on the new engine. A sealed arena,
// every promotion unlocked, endless waves with a boss every fifth wave.
import { VIEW_W } from '../config.js';
import { PlayScene } from './play.js';
import { newGame } from '../save.js';
import { Enemy } from '../entities/enemies.js';
import { Boss } from '../entities/boss.js';
import { AREAS } from '../world/map.js';
import { createRng, randInt } from '../rng.js';
import { t } from '../i18n.js';

const BEST_KEY = 'pawns-ascension-survive-best';
const BOSS_CYCLE = ['captain', 'thorn', 'ironrook', 'forge', 'queen'];

function arenaProgress() {
  const progress = newGame();
  progress.room = 'w_boss';
  progress.respawn = 'w_boss';
  progress.bosses = ['thorn'];
  progress.owned = { forms: ['pawn', 'rook', 'knight', 'bishop', 'queen'], relics: ['slide'], seals: [], shards: 2, crystals: 2 };
  return progress;
}

/**
 * Enemy list for a wave number (pure, seeded).
 * @param {number} wave 1-based
 * @returns {string[]} enemy types
 */
export function waveEnemies(wave, seed = 7) {
  const rnd = createRng(seed + wave);
  const pool = AREAS[Math.min(AREAS.length - 1, Math.floor((wave - 1) / 2))].enemies;
  const count = Math.min(10, 2 + wave);
  return Array.from({ length: count }, () => pool[randInt(rnd, 0, pool.length - 1)]);
}

export class SurviveScene extends PlayScene {
  constructor(storage, goTo) {
    super(arenaProgress(), null, goTo);
    this.bestStorage = storage;
    this.wave = 0;
    this.s.room.lockDoors();
    this.s.areaTitle = null;
    this.nextWave();
  }

  nextWave() {
    const s = this.s;
    this.wave++;
    s.fx.show(`${t('wave')} ${this.wave}`, 90);
    if (this.wave % 5 === 0) {
      s.boss = new Boss(BOSS_CYCLE[(this.wave / 5 - 1) % BOSS_CYCLE.length], s.room.pxW - 100, (s.room.grid.h - 2) * 16);
      return;
    }
    const floor = (s.room.grid.h - 2) * 16;
    s.enemies = waveEnemies(this.wave).map((type, i) => new Enemy(type, 60 + ((i * 97) % (s.room.pxW - 120)), type === 'bat' || type === 'wraith' ? 80 : floor));
  }

  step(input) {
    super.step(input);
    const s = this.s;
    if (s.room.locked && !s.room.locked.length) s.room.lockDoors();
    if (this.mode === 'play' && !s.enemies.length && !s.boss && !s.fx.banner) this.nextWave();
    if (this.mode === 'dead') this.recordBest();
  }

  recordBest() {
    if (this.recorded || !this.bestStorage) return;
    this.recorded = true;
    const best = Number(this.bestStorage.getItem(BEST_KEY) || 0);
    if (this.wave - 1 > best) this.bestStorage.setItem(BEST_KEY, String(this.wave - 1));
  }

  best() {
    try { return Number(this.bestStorage && this.bestStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
  }

  updateEnd(input) {
    if (input.confirm()) this.goTo('title');
  }

  draw(ctx) {
    super.draw(ctx);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4e4b0';
    ctx.fillText(`${t('wave')} ${this.wave}`, VIEW_W / 2, 16);
    if (this.mode === 'dead') {
      ctx.fillText(t('survive_over', { n: this.wave - 1 }), VIEW_W / 2, 190);
      ctx.fillText(`${t('best')}: ${this.best()}`, VIEW_W / 2, 206);
    }
    ctx.textAlign = 'left';
  }
}
