import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const css = await Promise.all(
  ['tokens', 'components', 'install', 'terminal', 'product'].map((name) =>
    readFile(new URL(`../../css/${name}.css`, import.meta.url), 'utf8'),
  ),
);
const house = css.slice(0, 4).join('\n');
const product = css[4];

async function render(page, overrides = '') {
  await page.setContent(`
    <style>${house}\n${overrides}</style>
    <style>
      * { transition: none !important; }
      body { background: var(--bg); color: var(--text); }
    </style>
    <input aria-label="Keyboard focus helper">
    <div class="hs-section-marker"><span>01 / PRODUCT</span></div>
    <button class="hs-button hs-button--primary">Get started</button>
    <div class="hs-install-toggle">
      <button class="hs-install-tab is-active">uv</button>
    </div>
    <div class="hs-install">
      <code>uv tool install product</code>
      <button class="hs-install-copy">Copy command</button>
    </div>
    <div class="hs-terminal"><div class="hs-terminal-bar">Terminal</div></div>
  `);
}

// Relative CSS colors serialize differently from legacy rgb(). Compare their
// rendered sRGB channels, including alpha, rather than their string notation.
async function color(page, selector, property, pseudo = null) {
  return page.locator(selector).evaluate(
    (element, { property, pseudo }) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d');
      const value = getComputedStyle(element, pseudo).getPropertyValue(property);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const alpha = context.getImageData(0, 0, 1, 1).data[3];
      // Sample opaque channels separately to avoid unpremultiplication rounding.
      context.fillStyle = `rgb(from ${value} r g b / 1)`;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3), alpha];
    },
    { property, pseudo },
  );
}

async function focusWithKeyboard(page, selector) {
  await page.getByRole('textbox', { name: 'Keyboard focus helper' }).focus();
  // macOS WebKit uses Option-Tab to include buttons in keyboard navigation.
  const key =
    process.platform === 'darwin' && page.context().browser().browserType().name() === 'webkit'
      ? 'Alt+Tab'
      : 'Tab';
  for (let step = 0; step < 4; step += 1) {
    await page.keyboard.press(key);
    if (await page.locator(selector).evaluate((element) => element === document.activeElement)) {
      break;
    }
  }
  await expect(page.locator(selector)).toBeFocused();
  expect(
    await page.locator(selector).evaluate((element) => element.matches(':focus-visible')),
  ).toBe(true);
}

const marker = '.hs-section-marker > span';
const button = '.hs-button--primary';
const copy = '.hs-install-copy';

for (const width of [390, 800, 1440]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('default colors preserve the reference palette in every control state', async ({
      page,
    }) => {
      await render(page);
      expect(await color(page, 'body', 'background-color')).toEqual([10, 12, 14, 255]);
      expect(await color(page, marker, 'color')).toEqual([34, 211, 238, 255]);
      expect(await color(page, marker, 'background-color')).toEqual([34, 211, 238, 20]);
      expect(await color(page, marker, 'border-top-color')).toEqual([34, 211, 238, 56]);
      expect(await color(page, button, 'background-color')).toEqual([34, 211, 238, 255]);
      expect(await color(page, button, 'color')).toEqual([8, 16, 20, 255]);
      await page.locator(button).hover();
      expect(await color(page, button, 'background-color')).toEqual([134, 234, 247, 255]);
      expect(await color(page, button, 'border-top-color')).toEqual([134, 234, 247, 255]);
      expect(await color(page, copy, 'background-color')).toEqual([34, 211, 238, 255]);
      expect(await color(page, copy, 'color')).toEqual([0, 0, 0, 255]);
      await page.locator(copy).hover();
      expect(await color(page, copy, 'background-color')).toEqual([0, 229, 255, 255]);
      await page.mouse.down();
      expect(await color(page, copy, 'background-color')).toEqual([0, 180, 216, 255]);
      await page.mouse.up();
      // Keyboard focus, rather than mouse focus, exercises :focus-visible.
      await focusWithKeyboard(page, copy);
      expect(await color(page, copy, 'outline-color')).toEqual([255, 255, 255, 255]);
      expect(await color(page, '.hs-install code', 'color', '::before')).toEqual([
        74, 222, 128, 255,
      ]);
    });

    for (const useProduct of [false, true]) {
      test(`one green accent updates every state ${useProduct ? 'with navy surfaces' : 'with default surfaces'}`, async ({
        page,
      }) => {
        await render(page, `${useProduct ? product : ''}\n:root { --accent: #4ade80; }`);
        expect(await color(page, 'body', 'background-color')).toEqual(
          useProduct ? [15, 23, 42, 255] : [10, 12, 14, 255],
        );
        expect(await color(page, marker, 'color')).toEqual([74, 222, 128, 255]);
        for (const property of ['background-color', 'border-top-color']) {
          const [r, g, b, a] = await color(page, marker, property);
          expect(g).toBeGreaterThan(r);
          expect(g).toBeGreaterThan(b);
          expect(a).toBeGreaterThan(0);
        }
        expect(await color(page, '.hs-install-tab', 'color')).toEqual([74, 222, 128, 255]);
        await focusWithKeyboard(page, '.hs-install-tab');
        expect(await color(page, '.hs-install-tab', 'outline-color')).toEqual([74, 222, 128, 255]);
        await page.locator(button).hover();
        const primaryHover = await color(page, button, 'background-color');
        await page.locator(copy).hover();
        const copyHover = await color(page, copy, 'background-color');
        await page.mouse.down();
        const copyPressed = await color(page, copy, 'background-color');
        await page.mouse.up();
        for (const [r, g, b] of [primaryHover, copyHover, copyPressed]) {
          expect(g).toBeGreaterThan(r);
          expect(g).toBeGreaterThan(b);
        }
        expect(copyHover).not.toEqual(copyPressed);
        expect(await color(page, '.hs-install', 'background-color')).toEqual([9, 14, 17, 255]);
        expect(await color(page, '.hs-terminal', 'background-color')).toEqual([9, 14, 17, 255]);
      });
    }

    test('navy surfaces and foreground or state adjustments read their tokens', async ({
      page,
    }) => {
      await render(
        page,
        `${product}\n:root {
        --accent: #1d4ed8;
        --button-fg: white;
        --accent-hover: #1e40af;
        --copy-fg: white;
        --copy-hover: #1e40af;
        --copy-active: #1e3a8a;
        --copy-focus: #fde047;
      }`,
      );
      expect(await color(page, 'body', 'color')).toEqual([255, 255, 255, 255]);
      expect(await color(page, '.hs-section-marker', 'color')).toEqual([148, 163, 184, 255]);
      // Use the actual panel and border tokens as a site would.
      await page.locator('body').evaluate((element) => {
        element.style.backgroundColor = 'var(--panel)';
        element.style.borderTop = '1px solid var(--line)';
      });
      expect(await color(page, 'body', 'background-color')).toEqual([30, 41, 59, 255]);
      expect(await color(page, 'body', 'border-top-color')).toEqual([51, 65, 85, 255]);
      expect(await color(page, button, 'color')).toEqual([255, 255, 255, 255]);
      expect(await color(page, copy, 'color')).toEqual([255, 255, 255, 255]);
      await page.locator(button).hover();
      expect(await color(page, button, 'background-color')).toEqual([30, 64, 175, 255]);
      await page.locator(copy).hover();
      expect(await color(page, copy, 'background-color')).toEqual([30, 64, 175, 255]);
      await page.mouse.down();
      expect(await color(page, copy, 'background-color')).toEqual([30, 58, 138, 255]);
      await page.mouse.up();
      await focusWithKeyboard(page, copy);
      expect(await color(page, copy, 'outline-color')).toEqual([253, 224, 71, 255]);
    });
  });
}
