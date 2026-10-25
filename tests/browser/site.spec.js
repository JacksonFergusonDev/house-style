import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const css = (
  await Promise.all(['tokens', 'components', 'site'].map((n) => read(`css/${n}.css`)))
).join('\n');
const field = await read('js/field.js');

// Enough of three.js for js/field.js to run without WebGL, recording the colour it's given.
const fakeThree = `
  const noop = () => {};
  const chain = { set() { return { add: noop }; } };
  class Vector { set() { return this; } }
  window.fieldColors = [];
  window.fakeThree = {
    WebGLRenderer: class { setPixelRatio() {} setSize() {} getDrawingBufferSize() {} render() {} dispose() {} },
    Scene: class { add() {} },
    PerspectiveCamera: class { position = chain; setViewOffset() {} updateProjectionMatrix() {} lookAt() {} rotateZ() {} },
    BufferAttribute: class {},
    BufferGeometry: class { setAttribute() {} setDrawRange() {} },
    ShaderMaterial: class { constructor(options) { this.uniforms = options.uniforms; } },
    Color: class { set(value) { window.fieldColors.push(value); } },
    Vector2: Vector,
    Vector3: Vector,
    Group: class { position = { set: noop }; scale = { setScalar: noop }; rotation = {}; add() {} },
    Line: class {},
    NormalBlending: 'normal',
    AdditiveBlending: 'add',
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
          <a class="hs-bar-link hs-wide" href="#home"><svg viewBox="0 0 1 1"></svg>Home</a>
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
    <script>${fakeThree}</script>
    <script type="module">${field}\nwindow.startField = startField;</script>
  `);
  await page.waitForFunction(() => typeof window.startField === 'function');
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

  test('the motion button stays hidden without WebGL', async ({ page }) => {
    await render(page);
    const started = await page.evaluate(() =>
      window.startField(
        {
          WebGLRenderer: class {
            constructor() {
              throw new Error('no WebGL');
            }
          },
        },
        document.querySelector('.hs-field'),
        document.querySelector('.hs-motion'),
      ),
    );
    expect(started).toBeUndefined();
    await expect(page.locator('.hs-motion')).toBeHidden();
  });

  test('the field starts paused for reduced motion, and its button toggles it', async ({
    page,
  }) => {
    // playwright.config sets reducedMotion: 'reduce'.
    await render(page);
    await page.evaluate(() =>
      window.startField(
        window.fakeThree,
        document.querySelector('.hs-field'),
        document.querySelector('.hs-motion'),
      ),
    );
    const motion = page.locator('.hs-motion');
    // The visible text is the whole accessible name, and says what a press does.
    await expect(motion).toHaveAccessibleName('Play motion');
    await expect(motion).toHaveAttribute('data-hs-paused', 'true');
    await expect(page.locator('.hs-motion-play')).toBeVisible();
    await expect(page.locator('.hs-motion-pause')).toBeHidden();

    await motion.click();
    await expect(motion).toHaveAccessibleName('Pause motion');
    await expect(motion).toHaveAttribute('data-hs-paused', 'false');
    await expect(page.locator('.hs-motion-pause')).toBeVisible();
    await expect(page.locator('.hs-field')).toHaveClass(/hs-field--ready/);
  });

  test('the field draws in the accent, and refresh() follows a change', async ({ page }) => {
    await render(page, { accent: ':root { --accent: #4ade80; }' });
    const control = await page.evaluateHandle(() =>
      window.startField(
        window.fakeThree,
        document.querySelector('.hs-field'),
        document.querySelector('.hs-motion'),
      ),
    );
    expect(await page.evaluate(() => window.fieldColors.at(-1))).toBe('rgb(74, 222, 128)');

    await page.evaluate(() =>
      document.querySelector('.hs-field').style.setProperty('--hs-field-color', '#0e7490'),
    );
    await control.evaluate((field) => field.refresh());
    expect(await page.evaluate(() => window.fieldColors.at(-1))).toBe('rgb(14, 116, 144)');
  });
});
