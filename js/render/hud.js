// In-game HUD: SOTN-style HP/MP frame top-left, Super Metroid minimap top-right,
// boss health bar at the bottom.
import { VIEW_W, VIEW_H } from '../config.js';
import { t } from '../i18n.js';
import { drawSprite } from './assets.js';
import { drawMap } from './mapview.js';
import { panel } from './fx.js';

const FONT = '8px "Press Start 2P", monospace';

function bar(ctx, x, y, w, value, max, fill, back) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 1, y - 1, w + 2, 6);
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.round((w * Math.max(0, value)) / max), 4);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x, y, Math.round((w * Math.max(0, value)) / max), 1);
}

function text(ctx, s, x, y, color = '#f4e4b0') {
  ctx.fillStyle = '#000';
  ctx.fillText(s, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function statusFrame(ctx, hud) {
  panel(ctx, 4, 4, 132, 38);
  ctx.save();
  ctx.beginPath(); ctx.rect(7, 7, 26, 32); ctx.clip();
  ctx.fillStyle = '#1a1030'; ctx.fillRect(7, 7, 26, 32);
  drawSprite(ctx, `hero_${hud.form}`, 20, 44, { scale: 0.85 });
  ctx.restore();
  ctx.font = FONT;
  text(ctx, `${t('lv')}${hud.level}`, 37, 15, '#ffffff');
  text(ctx, `${hud.hp}`, 82, 15, '#ff8a8a');
  bar(ctx, 37, 19, 94, hud.hp, hud.maxHp, '#e02838', '#3a0a10');
  bar(ctx, 37, 28, 94, hud.mp, hud.maxMp, '#3870f0', '#0a1440');
  text(ctx, `◆${hud.essence}`, 37, 41, '#c8a0ff');
}

function minimap(ctx, hud) {
  const w = 80;
  const h = 48;
  const x = VIEW_W - w - 4;
  panel(ctx, x, 4, w, h);
  ctx.save();
  ctx.beginPath(); ctx.rect(x + 3, 7, w - 6, h - 6); ctx.clip();
  drawMap(ctx, { ...hud.map, cell: 8, cx: x + w / 2, cy: 4 + h / 2 });
  ctx.restore();
}

function bossBar(ctx, boss) {
  const w = 220;
  const x = (VIEW_W - w) / 2;
  panel(ctx, x - 6, VIEW_H - 28, w + 12, 24);
  ctx.font = FONT;
  text(ctx, t(`boss_${boss.id}`), x, VIEW_H - 16, '#ffd0d0');
  bar(ctx, x, VIEW_H - 12, w, boss.hp, boss.maxHp, '#b01860', '#2a0414');
}

/**
 * Draw the whole HUD.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{form:string, level:number, hp:number, maxHp:number, mp:number, maxMp:number, essence:number, map:object, boss:object|null, areaTitle:object|null}} hud
 */
export function drawHud(ctx, hud) {
  statusFrame(ctx, hud);
  minimap(ctx, hud);
  if (hud.boss && !hud.boss.dead) bossBar(ctx, hud.boss);
  if (hud.areaTitle) areaTitle(ctx, hud.areaTitle);
}

function areaTitle(ctx, a) {
  ctx.globalAlpha = Math.min(1, a.life / 30);
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  text(ctx, a.text, VIEW_W / 2, 120, '#f4e4b0');
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}
