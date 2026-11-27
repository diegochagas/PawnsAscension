// Boot: load art, run a fixed 60 Hz update loop, switch scenes.
// Test hooks: ?room=<id> starts there, ?give=rook,knight,slide grants items,
// ?scene=survive opens Survive; window.__game exposes state to Playwright.
import { VIEW_W, VIEW_H } from './config.js';
import { Input } from './input.js';
import { loadAssets } from './render/assets.js';
import { TitleScene } from './scenes/title.js';
import { PlayScene } from './scenes/play.js';
import { SurviveScene } from './scenes/survive.js';
import { newGame, loadGame } from './save.js';
import { collect } from './world/progress.js';
import { roomIndex } from './world/map.js';
import { getLang, setLang, t } from './i18n.js';

const LANG_KEY = 'pawns-ascension-lang';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
ctx.imageSmoothingEnabled = false;

const storage = safeStorage();
const input = new Input();
const params = new URLSearchParams(location.search);
let scene = null;

function safeStorage() {
  try { localStorage.setItem('__probe', '1'); localStorage.removeItem('__probe'); return localStorage; } catch { return null; }
}

function debugGame() {
  let data = newGame();
  const room = params.get('room');
  if (room && roomIndex().has(room)) data.room = room;
  for (const item of (params.get('give') || '').split(',').filter(Boolean)) data.owned = collect(data.owned, item);
  if (params.get('xp')) data.xp = Number(params.get('xp'));
  return data;
}

function goTo(name) {
  if (name === 'title') scene = new TitleScene({ hasSave: () => Boolean(storage && loadGame(storage)), start, onLang });
  updateLangButton();
}

function start(kind) {
  if (kind === 'survive') { scene = new SurviveScene(storage, goTo); return; }
  const data = kind === 'continue' && storage ? loadGame(storage) : params.has('room') ? debugGame() : newGame();
  scene = new PlayScene(data || newGame(), storage, goTo);
  if (kind === 'new_game') scene.s.save();
}

function onLang() {
  try { storage && storage.setItem(LANG_KEY, getLang()); } catch { /* language just won't persist */ }
  updateLangButton();
}

function updateLangButton() {
  const btn = document.getElementById('lang');
  if (btn) btn.textContent = getLang() === 'en' ? 'PT' : 'EN';
  document.documentElement.lang = getLang() === 'en' ? 'en' : 'pt-BR';
  const hint = document.getElementById('hint');
  if (hint) hint.textContent = t('controls');
}

let last = 0;
let acc = 0;
function loop(now) {
  acc = Math.min(acc + (now - last), 100);
  last = now;
  while (acc >= 1000 / 60) {
    input.frame();
    scene.update(input);
    acc -= 1000 / 60;
  }
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  scene.draw(ctx);
  requestAnimationFrame(loop);
}

async function boot() {
  const saved = storage && storage.getItem(LANG_KEY);
  if (saved === 'pt' || saved === 'en') setLang(saved);
  else if ((navigator.language || '').startsWith('pt')) setLang('pt');
  input.bind(document);
  document.getElementById('lang').addEventListener('click', () => { setLang(getLang() === 'en' ? 'pt' : 'en'); onLang(); });
  await loadAssets();
  await document.fonts.load('8px "Press Start 2P"').catch(() => null);
  goTo('title');
  if (params.get('scene') === 'survive') start('survive');
  else if (params.has('room')) start('debug');
  window.__game = { get scene() { return scene; }, start, input };
  requestAnimationFrame((now) => { last = now; loop(now); });
}

boot();
