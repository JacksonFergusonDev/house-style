# house-style

The shared look of [jacksonferguson.me](https://jacksonferguson.me) and the project sites on its subdomains, such as [protostar.jacksonferguson.me](https://protostar.jacksonferguson.me): one palette, one set of typefaces, and the components every page shares.

Sites never load these files from here at runtime. Each one copies a tagged release into its own build, so a change reaches a site only when that site moves to the new tag and its own review shows what changed.

## What's here

| File | What it gives a page |
| --- | --- |
| `css/tokens.css` | The palette (`--bg`, `--panel`, `--text`, `--muted`, `--accent`, `--line`), the typefaces (`--sans`, `--mono`), the type scale (`--fs-*`), and the code surfaces (`--code-*`, `--prompt`). |
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

Load the CSS in this order, before a site's own styles: `fonts.css`, `tokens.css`, then any components. The files are plain CSS and ES modules with no build step.

## Using it

### A Node site (Astro, Vite)

Depend on a tag:

```json
"dependencies": {
  "house-style": "github:JacksonFergusonDev/house-style#v1.0.0"
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

Vendor a tag into the docs with a sync script, as Protostar's `scripts/sync_house_style.py` does: it downloads the tag's `css/`, `js/`, and `fonts/` into `docs/house/`, and `--check` fails when the copy differs from the tag. Reference the vendored files from the site's configuration, and load the scripts as ES modules.

## Changing it

1. Change the files, and check each site that uses them against the change.
1. Add the change to `CHANGELOG.md` and bump `version` in `package.json`.
1. Tag the release (`git tag v1.1.0 && git push --tags`).
1. Move each site to the new tag in its own pull request.

Bump the major version when a class, token, or function is renamed or removed, or when a value changes in a way a site would notice.
