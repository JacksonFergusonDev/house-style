# house-style

The shared look of [jacksonferguson.me](https://jacksonferguson.me) and the project sites on its subdomains, such as [protostar.jacksonferguson.me](https://protostar.jacksonferguson.me): shared palettes, one set of typefaces, and the components every page shares.

Sites never load these files from here at runtime. Each one copies a tagged release into its own build, so a change reaches a site only when that site moves to the new tag and its own review shows what changed.

## What's here

| File | What it gives a page |
| --- | --- |
| `css/tokens.css` | The palette (`--bg`, `--panel`, `--text`, `--muted`, `--accent`, `--line`), the typefaces (`--sans`, `--mono`), the type scale (`--fs-*`), and the code surfaces (`--code-*`, `--prompt`). |
| `css/product.css` | Optional navy backgrounds, panels, borders, and text for product sites and apps. |
| `css/fonts.css` | Self-hosted DM Sans (400 to 700), JetBrains Mono (400), and the Nerd Font symbols terminal recordings use. |
| `css/fonts-extended.css` | Italic DM Sans and bold JetBrains Mono, for documentation with emphasis and highlighted code. |
| `css/components.css` | `.hs-section-marker` and `.hs-button` (with `.hs-button--primary`). |
| `css/terminal.css` | `.hs-terminal`, the window recordings and screenshots sit in, and the asciinema-player skin. |
| `css/install.css` | `.hs-install`, an install command with a package-manager toggle and a copy button. |
| `css/icons.css` | `.hs-icon hs-icon-<name>`: the icons in `icons/`, drawn in the text's color for pages that can't inline SVG. |
| `icons/*.svg` | The house icons: arrows and other line icons, brand marks, and the jacksonferguson.me mark. |
| `js/copy-command.js` | `initCopyCommands(root)`: wires the install box's tabs and copy buttons. |
| `js/cast.js` | `castOptions()`, `mountCast(create, element)`, `loadSymbolsFont()`, `whenVisible(element, callback)`: plays a recording in a terminal window. |

[GUIDELINES.md](GUIDELINES.md) holds the design and writing rules every site follows, such as which arrow a link takes and who each page is written for; each site's `AGENTS.md` points at the copy it uses. Each CSS file's header shows the markup it expects. Every class is prefixed `hs-` so it can't collide with a site's own styles or its documentation theme.

Load the CSS in this order, before a site's own styles: `fonts.css`, `tokens.css`, the optional `product.css`, then any components. The files are plain CSS and ES modules with no build step.

## Using it

### A Node site (Astro, Vite)

Depend on a tag:

```json
"dependencies": {
  "house-style": "github:JacksonFergusonDev/house-style#v1.6.0"
}
```

```js
import 'house-style/css/fonts.css';
import 'house-style/css/tokens.css';
import 'house-style/css/terminal.css';
import { initCopyCommands } from 'house-style/js/copy-command.js';
```

The bundler copies the fonts and fingerprints them like any other asset.

### A documentation site without Node (Zensical, MkDocs)

Vendor a tag into the docs with `scripts/vendor.py`, run from that same tag so the rules for copying a release come from the release. It needs only [uv](https://docs.astral.sh/uv/), not a Python project:

```sh
uv run https://raw.githubusercontent.com/JacksonFergusonDev/house-style/v1.6.0/scripts/vendor.py --tag v1.6.0 docs/house
```

It writes the tag's CSS, scripts, fonts, icons, and guidelines into `docs/house/`, renaming Markdown files to `.txt` so the docs don't build them as pages. Commit the result, and add `--check` in CI (Protostar pins the tag in its `justfile` and runs this through `just sync-house-style`) to fail when the copy differs from the tag. Reference the vendored files from the site's configuration, and load the scripts as ES modules.

## Product themes and brand accents

The default palette preserves jacksonferguson.me and Protostar's cyan appearance. Product sites and apps can opt into the shared navy palette by loading `css/product.css` after `css/tokens.css`. It sets the background to `#0f172a`, panels to `#1e293b`, text to white, muted text to `#94a3b8`, and borders to `#334155`. Code, terminal, and install surfaces stay dark in either palette.

For example, a Star Ground site would load:

```js
import 'house-style/css/fonts.css';
import 'house-style/css/tokens.css';
import 'house-style/css/product.css';
import 'house-style/css/components.css';
import 'house-style/css/install.css';
import './brand.css';
```

Its own `brand.css` chooses green:

```css
:root {
  --accent: #4ade80;
}
```

Set the accent on `:root`, where the derived tokens are defined. Section-marker tints and borders, primary-button hover, and copy-button hover and pressed states all follow it, so the project needs no component overrides. The navy palette is optional; an accent override also works with the default surfaces. These styles use CSS relative colors, so the site needs a browser that supports them.

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
1. Add the change to `CHANGELOG.md` and bump `version` in `package.json`.
1. Tag the release (`git tag v1.1.0 && git push --tags`).
1. Move each site to the new tag in its own pull request.

Bump the major version when a class, token, or function is renamed or removed, or when a value changes in a way a site would notice.
