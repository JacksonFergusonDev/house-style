import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const css = (
  await Promise.all(['tokens', 'components', 'site'].map((n) => read(`css/${n}.css`)))
).join('\n');
const field = await read('js/field.js');
const home = await read('html/bar-home.html');

// A scene that records what runField hands it, in place of a site's drawing.
const recorder = `
  window.scene = { styles: [], sizes: [], draws: [], restores: 0, disposed: false };
  window.recordingScene = {
    style: (style) => window.scene.styles.push(style),
    resize: (width, height) => window.scene.sizes.push([width, height]),
    draw: (time, delta) => window.scene.draws.push([time, delta]),
    restore: () => { window.scene.restores += 1; },
    dispose: () => { window.scene.disposed = true; },
  };
`;

async function render(page, { accent = '' } = {}) {
  await page.setContent(`
    <style>${css}\n${accent}</style>
    <style>* { transition: none !important; } body { margin: 0; background: var(--bg); color: var(--text); }</style>
    <header class="hs-bar">
      <div class="hs-bar-inner">
        <a class="hs-bar-mark" href="/"><img src="data:," alt="" width="30" height="30">Project</a>
        <nav class="hs-bar-nav" aria-label="Primary">
          <a href="#docs">Docs</a><a class="hs-wide" href="#why">Why?</a>
        </nav>
        <div class="hs-bar-end">
          <a class="hs-bar-link" href="#gh"><svg viewBox="0 0 1 1"></svg>GitHub</a>
          ${home}
        </div>
      </div>
    </header>
    <section class="hs-hero">
      <canvas class="hs-field" aria-hidden="true"></canvas>
      <button type="button" class="hs-motion" hidden>
        <span data-hs-motion-label>Pause motion</span>
        <svg class="hs-motion-pause" viewBox="0 0 1 1"></svg>
        <svg class="hs-motion-play" viewBox="0 0 1 1"></svg>
      </button>
      <h1>Hero</h1>
      <nav class="hs-jumps" aria-label="On this page"><a href="#one">01 / ONE<svg viewBox="0 0 1 1"></svg></a></nav>
    </section>
    <section class="hs-grid" id="one" style="height: 400px"></section>
    <footer class="hs-footer">
      <div class="hs-footer-note"><p>A note.</p></div>
      <div class="hs-footer-inner"><p>© Owner.</p>
        <nav class="hs-footer-links" aria-label="Social"><a href="#gh" aria-label="GitHub"><svg viewBox="0 0 1 1"></svg></a></nav>
      </div>
    </footer>
    <script>${recorder}</script>
    <script type="module">${field}\nObject.assign(window, { runField, resolveColor });</script>
  `);
  await page.waitForFunction(() => typeof window.runField === 'function');
}

const box = (page, selector) => page.locator(selector).first().boundingBox();

test.describe('the site shell', () => {
  test('the header bar is 80px, and 64px on phones, with narrow-screen links hidden', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await render(page);
    expect((await box(page, '.hs-bar')).height).toBe(80);
    await expect(page.locator('.hs-bar-nav .hs-wide')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 800 });
    expect((await box(page, '.hs-bar')).height).toBe(64);
    await expect(page.locator('.hs-bar-nav .hs-wide')).toBeHidden();
    await expect(page.locator('.hs-bar-link').first()).toBeHidden();
  });

  test('the hero fills the window below the bar, and nothing scrolls sideways', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await render(page);
    expect((await box(page, '.hs-hero')).height).toBe(720);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('icons take each piece’s size', async ({ page }) => {
    await render(page);
    expect((await box(page, '.hs-jumps svg')).width).toBe(12);
    expect((await box(page, '.hs-footer-links svg')).width).toBe(16);
    expect((await box(page, '.hs-bar-link svg')).width).toBe(14);
  });

  test('header icons come before their labels, dimmed, and turn the accent on hover', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await render(page);
    const color = (selector) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).color);
    const tokens = await page.evaluate(() => {
      const probe = (name) => {
        const el = document.createElement('span');
        el.style.color = `var(${name})`;
        document.body.append(el);
        const value = getComputedStyle(el).color;
        el.remove();
        return value;
      };
      return { muted: probe('--muted'), text: probe('--text'), accent: probe('--accent') };
    });

    for (const link of await page.locator('.hs-bar-link').all()) {
      // The icon is the link's first child, so it reads before the label.
      expect(await link.evaluate((el) => el.firstElementChild?.tagName.toLowerCase())).toBe('svg');
    }
    expect(await color('.hs-bar-link')).toBe(tokens.text);
    expect(await color('.hs-bar-link svg')).toBe(tokens.muted);
    expect(await color('.hs-bar-link-mark')).toBe(tokens.muted);

    await page.locator('.hs-bar-link-mark').hover();
    expect(await color('.hs-bar-link-mark')).toBe(tokens.accent);
    await page.locator('.hs-bar-link').first().hover();
    expect(await color('.hs-bar-link svg')).toBe(tokens.accent);
  });

  test('the jacksonferguson.me mark is 18px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await render(page);
    const mark = await box(page, '.hs-bar-link-mark');
    expect([mark.width, mark.height]).toEqual([18, 18]);
  });

  test('the motion button stays hidden until a field runs', async ({ page }) => {
    await render(page);
    await expect(page.locator('.hs-motion')).toBeHidden();
  });

  test('the field starts paused for reduced motion, and its button toggles it', async ({
    page,
  }) => {
    // playwright.config sets reducedMotion: 'reduce'.
    await render(page);
    await page.evaluate(() =>
      window.runField(
        document.querySelector('.hs-field'),
        document.querySelector('.hs-motion'),
        window.recordingScene,
      ),
    );
    const motion = page.locator('.hs-motion');
    // The visible text is the whole accessible name, and says what a press does.
    await expect(motion).toHaveAccessibleName('Play motion');
    await expect(motion).toHaveAttribute('data-hs-paused', 'true');
    await expect(page.locator('.hs-motion-play')).toBeVisible();
    await expect(page.locator('.hs-motion-pause')).toBeHidden();
    // Paused, it draws one still frame and never moves.
    const still = await page.evaluate(() => window.scene.draws);
    expect(still.every(([, delta]) => delta === 0)).toBe(true);

    await motion.click();
    await expect(motion).toHaveAccessibleName('Pause motion');
    await expect(motion).toHaveAttribute('data-hs-paused', 'false');
    await expect(page.locator('.hs-motion-pause')).toBeVisible();
    await page.waitForFunction(() => window.scene.draws.some(([, delta]) => delta > 0));
  });

  test('the scene is sized to the canvas and disposed when the canvas leaves', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await render(page);
    await page.evaluate(() =>
      window.runField(
        document.querySelector('.hs-field'),
        document.querySelector('.hs-motion'),
        window.recordingScene,
      ),
    );
    expect(await page.evaluate(() => window.scene.sizes[0])).toEqual([1280, 720]);

    await page.locator('.hs-motion').click();
    await page.evaluate(() => document.querySelector('.hs-field').remove());
    await page.waitForFunction(() => window.scene.disposed);
  });

  test('the scene gets the accent, and refresh() follows a change', async ({ page }) => {
    await render(page, { accent: ':root { --accent: #4ade80; }' });
    const control = await page.evaluateHandle(() =>
      window.runField(
        document.querySelector('.hs-field'),
        document.querySelector('.hs-motion'),
        window.recordingScene,
      ),
    );
    expect(await page.evaluate(() => window.scene.styles.at(-1))).toEqual({
      color: [74, 222, 128],
      strength: 0.36,
      blend: 'add',
    });

    await page.evaluate(() => {
      const field = document.querySelector('.hs-field');
      field.style.setProperty('--hs-field-color', '#0e7490');
      field.style.setProperty('--hs-field-blend', 'normal');
    });
    await control.evaluate((field) => field.refresh());
    expect(await page.evaluate(() => window.scene.styles.at(-1))).toEqual({
      color: [14, 116, 144],
      strength: 0.36,
      blend: 'normal',
    });
  });

  test('a lost WebGL context stops drawing until the scene restores it', async ({ page }) => {
    await render(page);
    await page.evaluate(() =>
      window.runField(
        document.querySelector('.hs-field'),
        document.querySelector('.hs-motion'),
        window.recordingScene,
      ),
    );
    await page.locator('.hs-motion').click();
    await page.waitForFunction(() => window.scene.draws.some(([, delta]) => delta > 0));

    // The browser restores a lost context only if the page cancels the event.
    const cancelled = await page.evaluate(() => {
      const event = new Event('webglcontextlost', { cancelable: true });
      document.querySelector('.hs-field').dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(cancelled).toBe(true);
    const drawn = await page.evaluate(() => window.scene.draws.length);
    // Pausing and playing while it's lost draws nothing either.
    await page.locator('.hs-motion').click();
    await page.locator('.hs-motion').click();
    await page.evaluate(() => new Promise((done) => setTimeout(done, 200)));
    expect(await page.evaluate(() => window.scene.draws.length)).toBe(drawn);

    await page.evaluate(() =>
      document.querySelector('.hs-field').dispatchEvent(new Event('webglcontextrestored')),
    );
    expect(await page.evaluate(() => window.scene.restores)).toBe(1);
    await page.waitForFunction((count) => window.scene.draws.length > count + 1, drawn);
  });

  test('resolveColor reads relative colours', async ({ page }) => {
    await render(page);
    const color = await page.evaluate(() => window.resolveColor('rgb(from #4ade80 r g b / 50%)'));
    expect(color).toEqual([74, 222, 128]);
  });
});
