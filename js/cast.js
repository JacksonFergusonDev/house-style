// Generated from src/ by npm run build. Do not edit.
/**
 * Helpers for terminal recordings in an `.hs-terminal-screen` (see
 * css/terminal.css). They take asciinema-player's `create` function rather
 * than importing it, so a site can bundle the player or load it on demand.
 */
/** Whether the reader asked for reduced motion. */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
/**
 * The player options every house recording uses. A recording loops unless
 * the reader asked for reduced motion, and never starts on its own: the page
 * decides when to call `play()`.
 */
export function castOptions({ reduceMotion = prefersReducedMotion() } = {}) {
  return {
    autoPlay: false,
    preload: true,
    poster: 'npt:0:00.1',
    loop: !reduceMotion,
    speed: 1,
    terminalFontFamily: "'JetBrains Mono', 'Symbols Nerd Font', 'Fira Code', monospace",
    terminalFontSize: '14px',
    fit: 'width',
    controls: 'auto',
  };
}
let symbols;
/**
 * Loads the Nerd Font symbols the recordings draw with, once per page.
 * Play a recording after this settles so its icons don't pop in.
 */
export function loadSymbolsFont() {
  symbols ??= document.fonts.load("14px 'Symbols Nerd Font'").catch(() => []);
  return symbols;
}
/**
 * Creates the player for an element's `data-asciinema` recording, once.
 *
 * The default preview is a seek into the recording rather than a timed
 * poster: asciinema-player 3.17 clears a poster without replaying an output
 * event at time zero, losing the prompt on the first play.
 * Returns the player, or undefined if the element has none to mount.
 */
export function mountCast(create, element, options = {}) {
  const src = element.dataset.asciinema;
  if (!src || element.dataset.castMounted) return undefined;
  element.dataset.castMounted = 'true';
  const settings = { ...castOptions(), ...options };
  if (settings.poster !== 'npt:0:00.1' || settings.autoPlay) {
    return create(src, element, settings);
  }
  delete settings.poster;
  const player = create(src, element, settings);
  const preview = player.seek(0.1);
  // Keep loading failures handled even when a reduced-motion reader never plays.
  void preview.catch(() => {});
  const play = player.play.bind(player);
  player.play = () => preview.then(play);
  return player;
}
/**
 * Calls `callback` once, the first time `element` intersects the viewport
 * grown by `rootMargin`. Without IntersectionObserver it calls it at once.
 *
 * Returns a function that stops waiting.
 */
export function whenVisible(element, callback, options = {}) {
  if (!('IntersectionObserver' in window)) {
    callback();
    return () => {};
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      callback();
    }
  }, options);
  observer.observe(element);
  return () => observer.disconnect();
}
