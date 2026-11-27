// Hits between the hero, enemies, the boss and projectiles.
import { overlaps } from '../physics.js';
import { damage } from '../stats.js';
import { t } from '../i18n.js';

function hitEnemy(s, foe, amount, fromX) {
  const dmg = damage(amount, foe.def.def);
  const killed = foe.hurt(dmg, fromX);
  s.fx.number(foe.centerX, foe.y - 4, dmg, '#ffffff');
  s.fx.burst(foe.centerX, foe.centerY, '#ffe0a0', 5);
  s.sound(killed ? 'kill' : 'hit');
  if (killed) onKill(s, foe);
}

function onKill(s, foe) {
  s.fx.burst(foe.centerX, foe.centerY, '#b070ff', 22, 2.5);
  if (foe instanceof Object && foe.def.xp) s.gainXp(foe.def.xp);
  if (Math.random() < 0.15) s.heal(8);
}

function hitBoss(s, boss, amount) {
  if (boss.state === 'intro' || boss.alpha < 0.5) return; // invulnerable: no fake damage numbers
  const dmg = damage(amount, boss.def.def);
  if (!boss.hurt(dmg)) {
    s.fx.number(boss.centerX, boss.y + 10, dmg, '#ffffff');
    s.sound('hit');
    return;
  }
  bossDefeated(s, boss);
}

function bossDefeated(s, boss) {
  s.fx.burst(boss.centerX, boss.centerY, '#ff5080', 60, 4);
  s.shake(30);
  s.sound('kill');
  s.progress.bosses.push(boss.id);
  s.room.unlockDoors();
  s.enemies = [];
  if (boss.id === 'king') { s.victory = 180; return; }
  s.progress.owned.seals.push(boss.id);
  s.gainXp(boss.def.xp);
  s.fx.show(t(`boss_${boss.id}`), 200, t('seal'));
}

function heroAttacks(s) {
  const box = s.hero.hitbox();
  if (!box) return;
  const atk = s.stats().atk;
  for (const foe of s.enemies) if (!foe.hitCd && overlaps(box, foe)) hitEnemy(s, foe, atk, s.hero.centerX);
  if (s.boss && !s.boss.hitCd && overlaps(box, s.boss)) hitBoss(s, s.boss, atk);
}

function heroShots(s, shot) {
  const box = shot.box();
  for (const foe of s.enemies) {
    if (foe.dead || shot.hits.has(foe) || !overlaps(box, foe)) continue;
    shot.hits.add(foe);
    hitEnemy(s, foe, shot.dmg, shot.x);
    if (!shot.def.pierce) { shot.dead = true; return; }
  }
  if (s.boss && !shot.hits.has(s.boss) && overlaps(box, s.boss)) {
    shot.hits.add(s.boss);
    hitBoss(s, s.boss, shot.dmg);
    if (!shot.def.pierce) shot.dead = true;
  }
}

function hurtHero(s, amount, fromX) {
  const dmg = damage(amount, s.stats().def);
  if (!s.hero.hurt(dmg, fromX)) return;
  s.fx.number(s.hero.centerX, s.hero.y - 4, dmg, '#ff6a6a');
  s.sound('hurt');
  s.shake(6);
}

function threats(s) {
  const h = s.hero;
  for (const foe of s.enemies) {
    if (overlaps(h, foe)) hurtHero(s, foe.def.atk, foe.centerX);
    const strike = foe.hitbox();
    if (strike && overlaps(h, strike)) hurtHero(s, foe.def.atk * 1.3, foe.centerX);
  }
  if (s.boss && !s.boss.dead && s.boss.state !== 'intro' && s.boss.alpha > 0.5 && overlaps(h, s.boss)) {
    hurtHero(s, s.boss.def.atk, s.boss.centerX);
  }
  for (const shot of s.shots) {
    if (shot.hero || shot.dead || !overlaps(h, shot.box())) continue;
    hurtHero(s, shot.dmg, shot.x);
    shot.dead = true;
  }
}

/**
 * Resolve every hit this frame and drop dead things.
 * @param {import('./session.js').Session} s
 */
export function resolveCombat(s) {
  heroAttacks(s);
  for (const shot of s.shots) if (shot.hero && !shot.dead) heroShots(s, shot);
  threats(s);
  s.enemies = s.enemies.filter((e) => !e.dead);
  s.shots = s.shots.filter((p) => !p.dead);
  if (s.boss && s.boss.dead) s.boss = null;
}
