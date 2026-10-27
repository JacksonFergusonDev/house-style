# Changelog

## Unreleased

- `afterLoad` starts the field within a second of load even when the browser never reports an idle moment. Chromium could leave the idle callback unrun on a page with no new frames to draw, so the field sometimes never started.
- Add pinned Ruff linting and formatting and strict mypy checks for the vendoring script and its tests, configured in `pyproject.toml` and run through the shared local and CI hooks.
- Move the existing Markdown lint settings from `rumdl.toml` into `pyproject.toml`, preserving the rules and checking all Markdown files when the shared configuration changes.
- Validate TOML files, symlinks, and executable shebangs in the shared hooks.

## 3.0.0

- **Breaking:** each site draws its own hero field. `js/field.js` no longer draws the Dadras attractor with three.js; it exports `runField(canvas, button, scene)`, which runs a site's drawing under the motion rules (still for reduced motion, paused off screen or in a hidden tab, the pause button) and hands it the canvas's `--hs-field-*` style. `afterLoad(start)` starts it after the page is up, and `resolveColor(value)` turns any CSS colour, relative colours included, into RGB channels. `startField` is removed.
- **Breaking:** the field no longer fades in: `.hs-field--ready` is removed, and the canvas shows as soon as a site draws on it.
- **Breaking:** `astro/HeroField.astro` is removed, and with it the optional `three` peer dependency.

## 2.0.0

- **Parts.** `parts.json` splits the release into `core` (fonts, tokens, components, icons, guidelines), `docs` (terminal, install box, recordings, extended fonts), `site`, and `astro`. `scripts/vendor.py` now requires `--parts` and copies only those parts plus core, so a documentation site no longer commits files it never loads. Node sites still install the whole release, which stays in `node_modules`.
- **The project-site shell**, lifted from Protostar's landing page, which followed jacksonferguson.me: `css/site.css` adds `.hs-bar` (header bar), `.hs-hero` with `.hs-field` and the `.hs-motion` pause button, `.hs-jumps`, `.hs-grid`, and `.hs-footer`. `js/field.js` exports `startField(three, canvas, button)`: the hero's moving Dadras attractor, taking three.js as an argument and its colour, strength, and blending from the canvas's `--hs-field-*` properties, so it follows each site's accent and light scheme.
- **Astro components** in `astro/`: `SiteBar`, `HeroField`, `JumpLinks`, `SiteFooter`, `SectionMarker`, and `Icon`. `three` is an optional peer dependency, for `HeroField`.
- `css/tokens.css`: `--subtle` (`#a1abb3`, quiet labels over moving backgrounds) and `--grid` (`#14202570`, the section grid's lines).
- **Breaking:** `css/product.css` is removed; every site uses the near-black palette with its own accent. The Nerd Font symbols `@font-face` moves from `fonts.css` to `terminal.css`, the only stylesheet that uses it. `vendor.py` requires `--parts`.

## 1.6.4

- Derive the CI Playwright container from `package-lock.json`, resolving its digest automatically so dependency updates need no separate image pin change.

## 1.6.3

- Add GitHub Actions CI that runs the same pre-commit checks as local development, including all three browser engines, workflow linting, and working-tree secret scanning.
- Use a version-pinned Playwright container in CI to avoid installing browsers and Linux dependencies on every run.
- Group unit tests in `tests/unit/` and browser tests in `tests/browser/`, with explicit runner discovery and updated import paths.
- Isolate Firefox preferences on macOS so local browser checks avoid the installed browser's protected app-data directory.

## 1.6.2

- `AGENTS.md`: update consuming repositories only when explicitly requested or when a release fixes an issue affecting that site. Publishing a release no longer requires adoption pull requests for every repository.

## 1.6.1

- `AGENTS.md`: register Star Ground's pinned `house/` copy, native Streamlit palette mapping, and planned React and Zensical consumers.

## 1.6.0

- `css/product.css`: an optional shared navy palette for product sites and apps. Load it after `tokens.css`, then set the project's `--accent`.
- Accent tints, primary-button hover, copy-button hover and pressed states, and their foregrounds and copy focus outline now read tokens. Setting `--accent` updates all accent colors; the default cyan palette retains the reference site's appearance.
- `GUIDELINES.md`: allow one brand accent per project and subdued background motion in that accent, with outcome colors defined by their role and accompanied by a label or icon.

## 1.5.0

- `scripts/vendor.py`: vendors a release into a site that can't install it with npm, such as a Zensical docs site, and `--check` fails when the copy differs. It uses only Python's standard library, so a site runs it from the tag it vendors with `uv run <url>`. It replaces Protostar's own `scripts/sync_house_style.py`.

## 1.4.2

- Add ESLint, Prettier, and Stylelint configurations adapted from the personal site, and run them alongside the JavaScript tests in prek pre-commit hooks.

## 1.4.1

- `GUIDELINES.md`: the Writing section is shorter and leads with its goal, readability. Bold marks what a reader scans for (labels, controls, defined terms) rather than only list labels, sentences may carry a supporting clause, and the only punctuation rule left is no em dashes.

## 1.4.0

- `GUIDELINES.md`: rules for writing. Every site speaks in one calm, clear, precise voice, and each page is written for one audience: General (homepages, project cards, READMEs, documentation landing pages), Users, or Technical. Documentation sites give each navigation section one audience and state each rule once.

## 1.3.1

- `icons/brand-python.svg`: the Python mark from Font Awesome, and `.hs-icon-brand-python` in `css/icons.css`.
- `GUIDELINES.md`: mention Python brand links.

## 1.3.0

- Prepare recording previews with a seek instead of a timed poster. The prompt and initial output now remain visible during the first playback, including recordings whose first frame is at time zero. Programmatic playback waits for the preview to finish; reduced-motion readers still get a paused preview.

## 1.2.0

- `GUIDELINES.md`: rules for documentation sites. Only top-level pages carry a navigation icon, cards at the top of a page are optional and come in twos, fours, or sixes, every page has a description, and terminal output is shown in the house window.

## 1.1.0

- `icons/`: the arrows and other line icons jacksonferguson.me draws, Font Awesome's GitHub, LinkedIn, and email marks, and the jacksonferguson.me mark. `css/icons.css` draws them as `.hs-icon hs-icon-<name>` for pages that can't inline SVG.
- `GUIDELINES.md`: the design rules every site follows, including which arrow a link takes.
- `AGENTS.md`: how to change this repository.

## 1.0.1

- `css/install.css` sizes in pixels instead of `rem`, so the install box looks the same on sites whose root font size isn't 16px, such as Zensical documentation. Nothing changes on a 16px root.

## 1.0.0

- Tokens, self-hosted fonts, section markers and buttons, the terminal window, and the install box, taken unchanged from jacksonferguson.me.
- `js/copy-command.js` wires install boxes; `js/cast.js` mounts asciinema recordings.
