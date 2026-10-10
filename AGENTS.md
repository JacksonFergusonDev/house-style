# house-style agent guidelines

This repository is the shared look of jacksonferguson.me and the project sites on its subdomains. Sites copy a tagged release at build time, so every change here reaches them only through a version bump.

## Rules for changing it

- **[GUIDELINES.md](GUIDELINES.md) is the design and writing contract.** Follow it in every file here, and change it here when a rule needs to change. Each site's `AGENTS.md` points at the copy it vendors.
- **jacksonferguson.me is the reference.** A rule that came from the site keeps its exact values. Before releasing a change, check that the site renders identically, unless the change is meant to restyle it. Compare the computed style of every element, `::before` and `::after` included, across its pages at several widths.
- **Plain files, no build step.** CSS is plain CSS, and scripts are ES modules that import nothing (pass a library in instead, as `mountCast(create, element)` does). Each script has a matching `.d.ts`.
- **Prefix every class `hs-`** so it can't collide with a site's own styles or a documentation theme.
- **Size in `px`, never `rem`.** Documentation themes change the root font size.
- **Icons live in `icons/`**: 24px line icons with a 1.5 stroke, and brand icons from Font Awesome Free. Add a new icon to `css/icons.css` too.
- **Version every change.** Bump `version` in `package.json`, add a `CHANGELOG.md` entry, and tag `vX.Y.Z`. A renamed or removed class, token, icon, or function is a major version. A visible change to a value is at least a minor one.
- **`scripts/vendor.py` serves every site that vendors a release.** Keep it to Python's standard library so `uv run` can fetch it by URL in any repository. A site runs it from the tag it vendors, so a change to it ships in a release like any other file.
- **Never hard-wrap Markdown prose.**

## Releasing a change to the sites

No site picks up a change here until it moves to the new tag. After tagging, open one pull request per site:

| Site | Repository | How it pins house-style | To move it to a new tag |
| --- | --- | --- | --- |
| jacksonferguson.me | `JacksonFergusonDev/JacksonFergusonDev.github.io` | `"house-style": "github:JacksonFergusonDev/house-style#vX.Y.Z"` in `package.json` | `npm install --save github:JacksonFergusonDev/house-style#vX.Y.Z`, then check its computed styles are unchanged unless the change meant to restyle it |
| protostar.jacksonferguson.me | `JacksonFergusonDev/protostar` | `HOUSE_STYLE_TAG` in `scripts/sync_house_style.py`, vendored into `docs/house/` | Change the tag, run `just sync-house-style`, and commit `docs/house/`; CI fails until the copy matches the tag |

A new site that adopts house-style adds a row here, and its own `AGENTS.md` says how it pins the tag and that shared styles change here, not in the site.
