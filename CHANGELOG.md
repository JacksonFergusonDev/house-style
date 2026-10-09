# Changelog

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
