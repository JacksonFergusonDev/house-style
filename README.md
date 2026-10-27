# house-style

The shared look of [jacksonferguson.me](https://jacksonferguson.me) and the project sites on its subdomains, such as [protostar.jacksonferguson.me](https://protostar.jacksonferguson.me): shared palettes, one set of typefaces, and the components every page shares.

Sites never load these files from here at runtime. Each one copies a tagged release into its own build, so a change reaches a site only when that site moves to the new tag and its own review shows what changed.

## What's here

house-style comes in parts, so a site takes only what it uses. `parts.json` lists each part's files.

| Part | File | What it gives a page |
| --- | --- | --- |
| **core**, every site | `css/tokens.css` | The palette (`--bg`, `--panel`, `--text`, `--muted`, `--subtle`, `--accent`, `--line`, `--grid`), the typefaces (`--sans`, `--mono`), the type scale (`--fs-*`), and the code surfaces (`--code-*`, `--prompt`). |
|  | `css/fonts.css` | Self-hosted DM Sans (400 to 700) and JetBrains Mono (400). |
|  | `css/components.css` | `.hs-section-marker` and `.hs-button` (with `.hs-button--primary`). |
|  | `css/icons.css` | `.hs-icon hs-icon-<name>`: the icons in `icons/`, drawn in the text's color for pages that can't inline SVG. |
|  | `icons/*.svg` | The house icons: arrows and other line icons, brand marks, and the jacksonferguson.me mark. |
| **docs**, documentation | `css/fonts-extended.css` | Italic DM Sans and bold JetBrains Mono, for emphasis and highlighted code. |
|  | `css/terminal.css` | `.hs-terminal`, the window recordings and screenshots sit in, the asciinema-player skin, and the Nerd Font symbols recordings draw with. |
|  | `css/install.css` | `.hs-install`, an install command with a package-manager toggle and a copy button. |
|  | `js/copy-command.js` | `initCopyCommands(root)`: wires the install box's tabs and copy buttons. |
|  | `js/cast.js` | `castOptions()`, `mountCast(create, element)`, `loadSymbolsFont()`, `whenVisible(element, callback)`: plays a recording in a terminal window. |
| **site**, a project site's shell | `css/site.css` | `.hs-bar` (the header bar), `.hs-hero` with `.hs-field` and its `.hs-motion` pause button, `.hs-jumps` (jump links), `.hs-grid` (the 80px section grid), and `.hs-footer`. |
|  | `js/field.js` | `runField(canvas, button, scene)`, `afterLoad(start)`, `resolveColor(value)`: runs the hero's moving background, which each site draws itself, under the motion rules. |
| **astro**, Astro sites | `astro/*.astro` | `SiteBar`, `JumpLinks`, `SiteFooter`, `SectionMarker`, and `Icon`, rendering the markup the CSS above expects. |

[GUIDELINES.md](GUIDELINES.md) holds the design and writing rules every site follows, such as which arrow a link takes and who each page is written for; each site's `AGENTS.md` points at the copy it uses. Each CSS file's header shows the markup it expects. Every class is prefixed `hs-` so it can't collide with a site's own styles or its documentation theme.

Load the CSS in this order, before a site's own styles: `fonts.css`, `tokens.css`, `components.css`, then any other part's stylesheets. The files are plain CSS and ES modules with no build step; the Astro components are source the site's own build compiles.

## Using it

### A Node site (Astro, Vite)

Depend on a tag. npm installs the whole release into `node_modules`, which isn't committed, and the bundler includes only the files a page imports:

```json
"dependencies": {
  "house-style": "github:JacksonFergusonDev/house-style#v2.0.0"
}
```

```js
import 'house-style/css/fonts.css';
import 'house-style/css/tokens.css';
import 'house-style/css/components.css';
import 'house-style/css/site.css';
```

An Astro site renders the shell with the components:

```astro
---
import SiteBar from 'house-style/astro/SiteBar.astro';
---

<SiteBar name="Project" logo="/favicon.svg" github="https://github.com/…" nav={[{ label: 'Docs', href: '/docs/' }]} />
<section class="hs-hero">…</section>
```

The bundler copies the fonts and icons and fingerprints them like any other asset.

### The hero's moving background

Each site draws its own field, so it can show something of its own. The site renders the canvas and pause button from `css/site.css`'s header, draws on the canvas with WebGL or a 2D context, and hands that drawing to `runField`. `runField` decides when to draw: it starts paused for readers who asked for reduced motion, stops off screen and in a hidden tab, drives the pause button, and passes in the canvas's `--hs-field-*` colour, strength, and blending. `afterLoad` starts it once the page is up, so the first screen paints as text:

```js
import { afterLoad, runField } from 'house-style/js/field.js';

afterLoad(() => {
  const gl = canvas.getContext('webgl2');
  if (!gl) return; // The hero keeps its plain background.
  runField(canvas, button, {
    style({ color, strength, blend }) {
      /* set uniforms; color is 0 to 255 */
    },
    resize(width, height) {
      /* size the drawing buffer */
    },
    draw(time, delta) {
      /* draw a frame; delta is 0 for a still redraw */
    },
    dispose() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  });
});
```

Call the returned `refresh()` after the page's colour scheme changes.

### A documentation site without Node (Zensical, MkDocs)

Vendor a tag into the docs with `scripts/vendor.py`, run from that same tag so the rules for copying a release come from the release. Name the parts the site uses; core always comes along. It needs only [uv](https://docs.astral.sh/uv/), not a Python project:

```sh
uv run https://raw.githubusercontent.com/JacksonFergusonDev/house-style/v2.0.0/scripts/vendor.py --tag v2.0.0 --parts docs,site docs/house
```

It writes those parts' files into `docs/house/`, renaming Markdown files to `.txt` so the docs don't build them as pages. Commit the result, and add `--check` in CI (Protostar pins the tag in its `justfile` and runs this through `just sync-house-style`) to fail when the copy differs from the tag. Reference the vendored files from the site's configuration, and load the scripts as ES modules.

## Brand accents

Every site uses the same near-black palette. A project sets its own accent on `:root`, after the house styles; Star Ground's `brand.css`, for example, chooses green:

```css
:root {
  --accent: #4ade80;
}
```

Set the accent on `:root`, where the derived tokens are defined. Section-marker tints and borders, primary-button hover, copy-button hover and pressed states, and the hero's moving field all follow it, so the project needs no component overrides. These styles use CSS relative colors, so the site needs a browser that supports them.

| Token | Role |
| --- | --- |
| `--accent` | Brand color for links, current items, filled controls, and focus outlines. |
| `--accent-soft`, `--accent-border` | Section-marker background and border, at 8% and 22% opacity. |
| `--accent-hover`, `--button-fg` | Primary-button hover background and foreground. |
| `--copy-hover`, `--copy-active`, `--copy-fg` | Copy-button hover background, pressed background, and foreground. |
| `--copy-focus` | Contrasting inset focus outline on a filled copy button. |

The relative interaction colors reproduce the original cyan shades at the default accent. Check foreground contrast in the normal, hover, pressed, and focus states when choosing an accent, and adjust the relevant tokens if needed. Success, warning, and error keep their own meanings even when one shares the brand color; use a label or icon as well as color to communicate the outcome.

Frameworks with native theme settings, such as Streamlit, should map these palette values to those settings. Their configuration does not read CSS custom properties automatically. Keep shared palette and component changes in house-style; a site's own styles choose its accent and any foreground or state adjustments needed for contrast.

## Development checks

Use Node.js 24 or newer and Python 3.12 or newer. Run `npm ci` to install the development tools, then `python3 -m pip install prek==0.5.7` (or `uv tool install prek==0.5.7`) and `prek install` to install the pre-commit and commit-message hooks. Install the browser binaries once:

```sh
npx playwright install chromium firefox webkit
```

Run `prek run --all-files` to check the whole repository. GitHub Actions runs this same command on pull requests and pushes to `main`, using the checks defined in `.pre-commit-config.yaml`: generic file checks, Prettier, ESLint, Stylelint, JavaScript and Python unit tests, Playwright in all three browser engines, actionlint, secret scanning, and Markdown linting and formatting. Local hooks select checks for the changed files; CI checks all files. Both environments fail if a formatter changes a file. The commit-message hook runs separately when committing locally.

Unit tests live in `tests/unit/`; browser tests live in `tests/browser/`. Each runner explicitly targets its own suite:

| Command | Check |
| --- | --- |
| `npm test` | JavaScript unit tests. |
| `npm run test:python` | Python unit tests for the vendoring script. |
| `npm run test:browser` | Browser colors and interaction states at phone, tablet, and desktop widths in Chromium, Firefox, and WebKit. |
| `npm run lint` | JavaScript, declarations, and CSS linting. |
| `npm run format:check` | Prettier formatting without writing files. |

On macOS, the Playwright configuration gives Firefox a temporary preferences directory to avoid an [upstream profile-access issue](https://github.com/microsoft/playwright/issues/42768). It lives under the operating system's temporary directory and is separate from the installed browser's preferences.

Browser hooks require the installed binaries and do not download them on every commit. CI uses the official Playwright container with browsers and system dependencies already installed, caches the hook environments, and uploads Playwright traces on failure. A setup job reads the Playwright version from `package-lock.json`, resolves the matching official image digest, and passes that image to the checks job. Updating the npm lockfile also updates the selected image; there is no separate image version pin to maintain. Secret scanning reads the working tree in both environments, excluding Git internals, installed dependencies, and generated local output through `.gitleaks.toml`.

These tools are development dependencies; the shared files still have no build step, and `scripts/vendor.py` uses only Python's standard library.

## Changing it

1. Change the files, and check each site that uses them against the change.
1. Record changes in the `Unreleased` section of `CHANGELOG.md`. Several changes may share one release.
1. When releasing, bump `version` in `package.json` and its lockfile, move the unreleased entries under the new version, and tag `vX.Y.Z`.
1. Update a consuming site in its own pull request only when explicitly requested or when the release fixes an issue affecting that site.

Development tooling and contributor documentation changes do not require a release by themselves. Changes to shared assets, guidelines, or `scripts/vendor.py` reach consuming sites through a release. Renaming or removing a class, token, icon, or function requires a major version. A visible change to a value requires at least a minor version; other backward-compatible fixes use a patch version.
