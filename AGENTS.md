# house-style agent guidelines

This repository is the shared look of jacksonferguson.me and the project sites on its subdomains. Sites copy a tagged release at build time, so every change here reaches them only through a version bump.

## Rules for changing it

- **[GUIDELINES.md](GUIDELINES.md) is the design and writing contract.** Follow it in every file here, and change it here when a rule needs to change. Each site's `AGENTS.md` points at the copy it vendors.
- **jacksonferguson.me is the reference.** A rule that came from the site keeps its exact values. Before releasing a change, check that the site renders identically, unless the change is meant to restyle it. Compare the computed style of every element, `::before` and `::after` included, across its pages at several widths.
- **Plain files, no build step.** CSS is plain CSS, and scripts are ES modules that import nothing (pass a library in instead, as `mountCast(create, element)` does). Each script has a matching `.d.ts`. The Astro components in `astro/` are source the consuming site compiles; they render the markup the CSS documents and add no styles of their own.
- **Every shipped file belongs to one part in `parts.json`.** A stylesheet references only files in its own part or core; `tests/unit/test_parts.py` checks both.
- **Prefix every class `hs-`** so it can't collide with a site's own styles or a documentation theme.
- **Size in `px`, never `rem`.** Documentation themes change the root font size.
- **Icons live in `icons/`**: 24px line icons with a 1.5 stroke, and brand icons from Font Awesome Free. Add a new icon to `css/icons.css` too.
- **Version each release.** Changes may accumulate under an `Unreleased` section in `CHANGELOG.md`. Before tagging a release, bump `version` in `package.json` and its lockfile, move those entries under the new version, and tag `vX.Y.Z`. Development tooling and contributor documentation changes do not require a release by themselves. Changes to shared assets, guidelines, or `scripts/vendor.py` reach consuming sites through a release. A renamed or removed class, token, icon, or function is a major version. A visible change to a value is at least a minor one; other backward-compatible fixes are patch versions.
- **`scripts/vendor.py` serves every site that vendors a release.** Keep it to Python's standard library so `uv run` can fetch it by URL in any repository. A site runs it from the tag it vendors, so a change to it ships in a release like any other file.
- **Never hard-wrap Markdown prose.**

## Adopting a release in a site

Each site pins its own release and adopts changes independently. Publishing a new house-style release does not trigger updates in consuming repositories. Open an adoption pull request only when explicitly requested or when the release fixes an issue affecting that site. Update only the requested or affected sites; leave other sites on their current pins.

Use the table below when an update is needed:

| Site | Repository | How it pins house-style | To move it to a new tag |
| --- | --- | --- | --- |
| jacksonferguson.me | `JacksonFergusonDev/JacksonFergusonDev.github.io` | `"house-style": "github:JacksonFergusonDev/house-style#vX.Y.Z"` in `package.json` | `npm install --save github:JacksonFergusonDev/house-style#vX.Y.Z`, then check its computed styles are unchanged unless the change meant to restyle it |
| protostar.jacksonferguson.me | `JacksonFergusonDev/protostar` | `house_style` in the `justfile`, vendored into `docs/house/` (parts `docs,site`) by this repository's `scripts/vendor.py` | Change the tag, run `just sync-house-style`, and commit `docs/house/`; CI fails until the copy matches the tag |
| Star Ground (Astro site in `web/`; Streamlit app until it's replaced) | `JacksonFergusonDev/star-ground` | `"house-style": "github:JacksonFergusonDev/house-style#vX.Y.Z"` in `web/package.json`; the site uses the core, site, and astro parts | `npm install --save github:JacksonFergusonDev/house-style#vX.Y.Z` in `web/`, then run its browser tests. The Streamlit app keeps its own palette in `.streamlit/config.toml`. |

A new site that adopts house-style adds a row here, and its own `AGENTS.md` says how it pins the tag and that shared styles change here, not in the site.
