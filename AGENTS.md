# house-style agent guidelines

This repository is the shared look of jacksonferguson.me and the project sites on its subdomains. Sites copy a tagged release at build time, so every change here reaches them only through a version bump.

## Rules for changing it

- **[GUIDELINES.md](GUIDELINES.md) is the design contract.** Follow it in every file here, and change it here when a rule needs to change. Each site's `AGENTS.md` points at the copy it vendors.
- **jacksonferguson.me is the reference.** A rule that came from the site keeps its exact values. Before releasing a change, check that the site renders identically, unless the change is meant to restyle it. Compare the computed style of every element, `::before` and `::after` included, across its pages at several widths.
- **Plain files, no build step.** CSS is plain CSS, and scripts are ES modules that import nothing (pass a library in instead, as `mountCast(create, element)` does). Each script has a matching `.d.ts`.
- **Prefix every class `hs-`** so it can't collide with a site's own styles or a documentation theme.
- **Size in `px`, never `rem`.** Documentation themes change the root font size.
- **Icons live in `icons/`**: 24px line icons with a 1.5 stroke, and brand icons from Font Awesome Free. Add a new icon to `css/icons.css` too.
- **Version every change.** Bump `version` in `package.json`, add a `CHANGELOG.md` entry, and tag `vX.Y.Z`. A renamed or removed class, token, icon, or function is a major version. A visible change to a value is at least a minor one.
- **Never hard-wrap Markdown prose.**
