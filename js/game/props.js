// Room props: decor, the bonfire + bard (save/warp), promotion altars and relic chests.
import { TILE } from '../config.js';
import { drawSprite } from '../render/assets.js';
import { collect } from '../world/progress.js';
import { t } from '../i18n.js';

const ITEM_ICON = { rook: 'hero_rook', knight: 'hero_knight', bishop: 'hero_bishop', queen: 'hero_queen', shard: 'shard', crystal: 'crystal', slide: 'orb' };

function near(hero, prop, dx = 22) {
  return Math.abs(hero.centerX - prop.x) < dx && Math.abs(hero.feetY - prop.y) < 24;
}

function takenKey(s, prop) {
  return `${s.room.id}:${prop.item}`;
}

function grant(s, prop) {
  s.progress.owned = collect(s.progress.owned, prop.item);
  s.hero.forms = s.progress.owned.forms;
  s.hero.relics = s.progress.owned.relics;
  s.progress.taken.push(takenKey(s, prop));
  s.refreshStats(prop.item === 'shard' || prop.item === 'crystal');
  s.fx.show(t(`got_${prop.item}`), 260, ['rook', 'knight', 'bishop', 'queen'].includes(prop.item) ? t('switch_hint') : '');
  s.fx.burst(prop.x, prop.y - 20, '#fff0a0', 40, 3);
  s.sound('pickup');
  s.save();
}

/**
 * Touch/interact with props. Returns 'bonfire' when the bonfire menu should open.
 * @param {import('./session.js').Session} s
 * @param {import('../input.js').Input} input
 * @returns {string|null}
 */
export function interact(s, input) {
  for (const prop of s.room.props) {
    if (prop.decor || !near(s.hero, prop)) continue;
    if (prop.type === 'bonfire' && input.pressed.down) return 'bonfire';
    if ((prop.type === 'altar' || prop.type === 'item') && !s.progress.taken.includes(takenKey(s, prop))) grant(s, prop);
  }
  return null;
}

/**
 * Rest at a bonfire: full heal, remember it as a warp target and respawn point, save.
 * @param {import('./session.js').Session} s
 */
export function rest(s) {
  if (!s.progress.bonfires.includes(s.room.id)) s.progress.bonfires.push(s.room.id);
  s.progress.respawn = s.room.id;
  s.refreshStats(true);
  s.save();
  s.fx.show(t('saved'), 150);
  s.sound('save');
}

function drawBonfire(ctx, prop, cam, tick) {
  const x = prop.x - cam.x;
  const y = prop.y - cam.y;
  drawSprite(ctx, 'brazier_big', x + 18, y);
  drawSprite(ctx, 'npc_bard', x - 16, y, { flip: true });
  const glow = 0.18 + 0.06 * Math.sin(tick / 5);
  ctx.fillStyle = `rgba(255,150,60,${glow})`;
  ctx.beginPath(); ctx.arc(x + 18, y - 30, 40, 0, Math.PI * 2); ctx.fill();
}

function drawPickup(ctx, s, prop, cam, tick) {
  const x = prop.x - cam.x;
  const y = prop.y - cam.y;
  const taken = s.progress.taken.includes(takenKey(s, prop));
  if (prop.type === 'item') drawSprite(ctx, taken ? 'chest_open' : 'chest', x, y);
  else drawSprite(ctx, 'altar', x, y);
  if (taken) return;
  const bob = Math.sin(tick / 12) * 3;
  ctx.fillStyle = 'rgba(255,240,180,0.25)';
  ctx.beginPath(); ctx.arc(x, y - 44 + bob, 16, 0, Math.PI * 2); ctx.fill();
  drawSprite(ctx, ITEM_ICON[prop.item], x, y - 30 + bob, { scale: prop.type === 'altar' ? 0.7 : 1 });
}

/**
 * Draw all props of the room (behind actors).
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawProps(ctx, s, cam, tick) {
  for (const prop of s.room.props) {
    if (prop.type === 'bonfire') drawBonfire(ctx, prop, cam, tick);
    else if (prop.type === 'altar' || prop.type === 'item') drawPickup(ctx, s, prop, cam, tick);
    else if (prop.decor) drawDecor(ctx, prop, cam, tick, s.room);
  }
}

function drawDecor(ctx, prop, cam, tick, room) {
  const tx = Math.floor(prop.x / TILE);
  const ty = Math.floor(prop.y / TILE);
  if (room.getTile(tx, ty) !== 0) return;
  drawSprite(ctx, prop.type, prop.x - cam.x, prop.y - cam.y);
  if (prop.type === 'torch') {
    ctx.fillStyle = `rgba(255,170,80,${0.12 + 0.05 * Math.sin(tick / 4 + prop.x)})`;
    ctx.beginPath(); ctx.arc(prop.x - cam.x, prop.y - cam.y - 18, 22, 0, Math.PI * 2); ctx.fill();
  }
}
