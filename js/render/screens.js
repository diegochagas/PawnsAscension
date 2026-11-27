// Full-screen overlays: pause (map / status), bonfire menu, death and ending.
import { VIEW_W, VIEW_H, FORM_ORDER } from '../config.js';
import { t } from '../i18n.js';
import { panel } from './fx.js';
import { drawMap, explored } from './mapview.js';
import { drawSprite } from './assets.js';
import { xpForLevel } from '../stats.js';
import { BOSS_SEALS } from '../world/map.js';

const FONT = '8px "Press Start 2P", monospace';
const AREA_KEYS = ['area_field', 'area_woods', 'area_cliffs', 'area_forge', 'area_battle', 'area_castle'];

function label(ctx, s, x, y, color = '#f4e4b0', align = 'left') {
  ctx.textAlign = align;
  ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1);
  ctx.fillStyle = color; ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

function tabs(ctx, active) {
  ctx.font = FONT;
  label(ctx, `◄ ${t('pause_map')}`, 24, 22, active === 'map' ? '#fff' : '#7a6a9a');
  label(ctx, `${t('pause_status')} ►`, VIEW_W - 24, 22, active === 'status' ? '#fff' : '#7a6a9a', 'right');
}

function mapTab(ctx, s, hud) {
  panel(ctx, 16, 30, VIEW_W - 32, VIEW_H - 76);
  ctx.save();
  ctx.beginPath(); ctx.rect(20, 34, VIEW_W - 40, VIEW_H - 84); ctx.clip();
  drawMap(ctx, { ...hud.map, cell: 12, cx: VIEW_W / 2, cy: (VIEW_H - 46) / 2 + 15 });
  ctx.restore();
  ctx.font = FONT;
  label(ctx, t(AREA_KEYS[s.room.spec.area]), VIEW_W / 2, 46, '#f4e4b0', 'center');
}

function statusTab(ctx, s, hud) {
  panel(ctx, 16, 30, VIEW_W - 32, VIEW_H - 76);
  const st = s.stats();
  drawSprite(ctx, `hero_${s.hero.form}`, 64, 120, { scale: 1.6 });
  ctx.font = FONT;
  const rows = [
    [t('level'), st.level], [t('hp'), `${s.hero.hp}/${s.maxHp}`], [t('mp'), `${s.hero.mp}/${s.maxMp}`],
    [t('atk'), st.atk], [t('def'), st.def], [t('exp'), s.progress.xp], [t('next'), Math.max(0, xpForLevel(st.level + 1) - s.progress.xp)],
    [t('explored'), `${explored(s.progress.visited)}%`], [t('time'), clock(s.progress.playFrames)],
  ];
  rows.forEach(([k, v], i) => { label(ctx, k, 110, 48 + i * 13, '#b8a8d8'); label(ctx, String(v), 230, 48 + i * 13, '#fff', 'right'); });
  formsList(ctx, s);
  label(ctx, `${t('seals')}: ${BOSS_SEALS.filter((b) => s.progress.owned.seals.includes(b)).length}/5`, 250, 178, '#ffd0d0');
}

function formsList(ctx, s) {
  label(ctx, t('forms'), 250, 48, '#b8a8d8');
  FORM_ORDER.forEach((f, i) => {
    const owned = s.progress.owned.forms.includes(f);
    const color = f === s.hero.form ? '#ffe070' : owned ? '#fff' : '#4a4060';
    label(ctx, owned ? t(`f_${f}`) : '???', 250, 62 + i * 22, color);
    if (owned) label(ctx, t(`p_${f}`), 250, 72 + i * 22, '#8a7aaa');
  });
}

function clock(frames) {
  const secs = Math.floor(frames / 60);
  const h = Math.floor(secs / 3600);
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  return `${h}:${m}:${String(secs % 60).padStart(2, '0')}`;
}

/** Pause screen with Map/Status tabs and Resume/Quit. */
export function drawPause(ctx, s, tab, menu, hud) {
  ctx.fillStyle = 'rgba(4,2,12,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  tabs(ctx, tab);
  if (tab === 'map') mapTab(ctx, s, hud);
  else statusTab(ctx, s, hud);
  ctx.font = FONT;
  [t('pause_resume'), t('pause_quit')].forEach((txt, i) => {
    label(ctx, (menu === i ? '▶ ' : '  ') + txt, 60 + i * 200, VIEW_H - 24, menu === i ? '#fff' : '#7a6a9a');
  });
}

/** Bonfire: rest or warp to another lit bonfire. */
export function drawBonfireMenu(ctx, options, menu) {
  const h = 30 + options.length * 14;
  panel(ctx, 120, 70, 240, h);
  ctx.font = FONT;
  options.forEach((o, i) => {
    const txt = o.kind === 'rest' ? t('rest') : `${t('warp')} ${t(AREA_KEYS[o.area])}`;
    label(ctx, (menu === i ? '▶ ' : '  ') + txt, 132, 92 + i * 14, menu === i ? '#fff' : '#9a8aba');
  });
}

/** Checkmate (death) or the ending card. */
export function drawEnd(ctx, mode, tick) {
  ctx.fillStyle = mode === 'dead' ? 'rgba(40,0,0,0.75)' : 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.font = '16px "Press Start 2P", monospace';
  const title = mode === 'dead' ? t('dead') : t('victory');
  ctx.font = mode === 'dead' ? '16px "Press Start 2P", monospace' : '9px "Press Start 2P", monospace';
  label(ctx, title, VIEW_W / 2, 120, mode === 'dead' ? '#ff4050' : '#f4e4b0', 'center');
  ctx.font = FONT;
  if (tick % 60 < 40) label(ctx, mode === 'dead' ? t('dead_hint') : t('victory2'), VIEW_W / 2, 160, '#fff', 'center');
}
