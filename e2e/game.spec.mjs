// Smoke + screenshot evidence: title, language toggle, new game flow, pause
// screens, one room per area, each boss, Survive mode.
import { test, expect } from '@playwright/test';

const SHOTS = 'e2e/screenshots';

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

async function ready(page, url) {
  await page.goto(url);
  await page.waitForFunction(() => window.__game && window.__game.scene);
  await page.waitForTimeout(400);
}

async function canvasDrawn(page) {
  return page.locator('canvas').evaluate((c) => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let distinct = 0;
    for (let i = 4; i < d.length; i += 400) if (d[i] !== d[0] || d[i + 1] !== d[1]) distinct++;
    return distinct > 100;
  });
}

async function hold(page, action, ms) {
  await page.evaluate((a) => { window.__game.input.down[a] = true; }, action);
  await page.waitForTimeout(ms);
  await page.evaluate((a) => { window.__game.input.down[a] = false; }, action);
}

test('title boots, draws and toggles language', async ({ page }, info) => {
  const errors = trackErrors(page);
  await ready(page, '/');
  expect(await canvasDrawn(page)).toBe(true);
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-title.png` });
  const lang = page.locator('#lang');
  await expect(lang).toHaveText('PT');
  await lang.click();
  await expect(lang).toHaveText('EN');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-title-pt.png` });
  expect(errors).toEqual([]);
});

test('new game reaches gameplay and the pause screens', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'keyboard flow covered on desktop');
  const errors = trackErrors(page);
  await ready(page, '/');
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(450); }
  await page.waitForFunction(() => window.__game.scene.s);
  expect(await page.evaluate(() => window.__game.scene.s.room.id)).toBe('t_start');
  await hold(page, 'right', 900);
  await page.screenshot({ path: `${SHOTS}/gameplay-start.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOTS}/pause-map.png` });
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOTS}/pause-status.png` });
  expect(errors).toEqual([]);
});

const AREA_ROOMS = ['t_yard', 'w_hollow', 'c_bridge', 'f_hall', 'b_field', 'k_hall'];
for (const room of AREA_ROOMS) {
  test(`area room ${room} renders`, async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'one viewport is enough per area');
    const errors = trackErrors(page);
    await ready(page, `/?room=${room}&give=rook,knight,bishop`);
    await hold(page, 'right', 600);
    expect(await canvasDrawn(page)).toBe(true);
    await page.screenshot({ path: `${SHOTS}/area-${room}.png` });
    expect(errors).toEqual([]);
  });
}

const BOSS_ROOMS = ['t_boss', 'w_boss', 'c_boss', 'f_boss', 'b_boss', 'k_throne'];
for (const room of BOSS_ROOMS) {
  test(`boss in ${room} appears and locks the doors`, async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop only');
    await ready(page, `/?room=${room}&xp=2000`);
    await hold(page, 'right', 900);
    await page.waitForFunction(() => window.__game.scene.s.boss, null, { timeout: 5000 });
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => window.__game.scene.s.room.locked.length)).toBeGreaterThan(0);
    await page.screenshot({ path: `${SHOTS}/boss-${room}.png` });
  });
}

test('survive mode starts a wave', async ({ page }, info) => {
  const errors = trackErrors(page);
  await ready(page, '/?scene=survive');
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__game.scene.wave)).toBe(1);
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-survive.png` });
  expect(errors).toEqual([]);
});

test('frame time stays under budget', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'desktop only');
  await ready(page, '/?room=t_yard');
  const avg = await page.evaluate(async () => {
    const times = [];
    let last = performance.now();
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      const now = performance.now();
      times.push(now - last);
      last = now;
    }
    return times.reduce((a, b) => a + b, 0) / times.length;
  });
  expect(avg).toBeLessThan(34);
});
