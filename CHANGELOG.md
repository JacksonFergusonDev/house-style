# Changelog

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
