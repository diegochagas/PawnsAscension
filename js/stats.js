// SOTN-style character stats: experience levels, HP/MP from level + upgrades,
// damage = attack * form multiplier - defense, never below 1.
import { LEVEL, HERO, FORMS, SHARD_HP, CRYSTAL_MP } from './config.js';

/**
 * Total experience needed to reach a level.
 * @param {number} level 1-based
 * @returns {number}
 * @example xpForLevel(1) === 0; xpForLevel(2) === 40
 */
export function xpForLevel(level) {
  let total = 0;
  for (let l = 1; l < level; l++) total += Math.round(LEVEL.base * Math.pow(LEVEL.growth, l - 1));
  return total;
}

/**
 * Level reached with a given amount of experience.
 * @param {number} xp
 * @returns {number}
 */
export function levelFor(xp) {
  let level = 1;
  while (level < LEVEL.max && xp >= xpForLevel(level + 1)) level++;
  return level;
}

/**
 * Derived stats for the hero.
 * @param {{xp: number, shards: number, crystals: number}} hero
 * @param {string} form key of FORMS
 * @returns {{level:number, maxHp:number, maxMp:number, atk:number, def:number}}
 */
export function heroStats(hero, form) {
  const level = levelFor(hero.xp);
  const f = FORMS[form];
  if (!f) throw new Error(`unknown form "${form}" (expected one of ${Object.keys(FORMS).join(', ')})`);
  return {
    level,
    maxHp: HERO.baseHp + (level - 1) * LEVEL.hpPer + hero.shards * SHARD_HP,
    maxMp: HERO.baseMp + (level - 1) * LEVEL.mpPer + hero.crystals * CRYSTAL_MP,
    atk: Math.round((10 + (level - 1) * LEVEL.atkPer) * f.atk),
    def: Math.round((2 + (level - 1) * LEVEL.defPer) / f.def),
  };
}

/**
 * Damage dealt by an attack.
 * @param {number} atk attacker attack
 * @param {number} def defender defense
 * @param {number} [mult=1] move multiplier
 * @returns {number} at least 1
 */
export function damage(atk, def, mult = 1) {
  return Math.max(1, Math.round(atk * mult - def));
}
