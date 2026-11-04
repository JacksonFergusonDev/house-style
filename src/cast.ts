/**
 * Helpers for terminal recordings in an `.hs-terminal-screen` (see
 * css/terminal.css). They take asciinema-player's `create` function rather
 * than importing it, so a site can bundle the player or load it on demand.
 */

export interface CastOptions {
  autoPlay: boolean;
  preload: boolean;
  poster: string;
  loop: boolean;
  speed: number;
  terminalFontFamily: string;
  terminalFontSize: string;
  fit: 'width';
  controls: 'auto';
}

/** Whether the reader asked for reduced motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The player options every house recording uses. A recording loops unless
 * the reader asked for reduced motion, and never starts on its own: the page
 * decides when to call `play()`.
 */
export function castOptions({
  reduceMotion = prefersReducedMotion(),
}: { reduceMotion?: boolean } = {}): CastOptions {
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

let symbols: Promise<FontFace[]> | undefined;

/**
 * Loads the Nerd Font symbols the recordings draw with, once per page.
 * Play a recording after this settles so its icons don't pop in.
 */
export function loadSymbolsFont(): Promise<FontFace[]> {
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
export function mountCast<
  Player extends {
    seek(time: number): Promise<unknown>;
    play(): Promise<unknown>;
  },
>(
  create: (src: string, element: HTMLElement, options: Record<string, unknown>) => Player,
  element: HTMLElement,
  options: Record<string, unknown> = {},
): Player | undefined {
  const src = element.dataset.asciinema;
  if (!src || element.dataset.castMounted) return undefined;
  element.dataset.castMounted = 'true';
  const settings: Record<string, unknown> = { ...castOptions(), ...options };
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
export function whenVisible(
  element: Element,
  callback: () => void,
  options: IntersectionObserverInit = {},
): () => void {
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
