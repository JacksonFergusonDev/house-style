// Generated from src/ by pnpm run build. Do not edit.
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
export declare function prefersReducedMotion(): boolean;
/**
 * The player options every house recording uses. A recording loops unless
 * the reader asked for reduced motion, and never starts on its own: the page
 * decides when to call `play()`.
 */
export declare function castOptions({ reduceMotion }?: { reduceMotion?: boolean }): CastOptions;
/**
 * Loads the Nerd Font symbols the recordings draw with, once per page.
 * Play a recording after this settles so its icons don't pop in.
 */
export declare function loadSymbolsFont(): Promise<FontFace[]>;
/**
 * Creates the player for an element's `data-asciinema` recording, once.
 *
 * The default preview is a seek into the recording rather than a timed
 * poster: asciinema-player 3.17 clears a poster without replaying an output
 * event at time zero, losing the prompt on the first play.
 * Returns the player, or undefined if the element has none to mount.
 */
export declare function mountCast<
  Player extends {
    seek(time: number): Promise<unknown>;
    play(): Promise<unknown>;
  },
>(
  create: (src: string, element: HTMLElement, options: Record<string, unknown>) => Player,
  element: HTMLElement,
  options?: Record<string, unknown>,
): Player | undefined;
/**
 * Calls `callback` once, the first time `element` intersects the viewport
 * grown by `rootMargin`. Without IntersectionObserver it calls it at once.
 *
 * Returns a function that stops waiting.
 */
export declare function whenVisible(
  element: Element,
  callback: () => void,
  options?: IntersectionObserverInit,
): () => void;
