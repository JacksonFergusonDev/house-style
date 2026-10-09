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
export function prefersReducedMotion(): boolean;

/** The player options every house recording uses. */
export function castOptions(settings?: { reduceMotion?: boolean }): CastOptions;

/** Loads the Nerd Font symbols the recordings draw with, once per page. */
export function loadSymbolsFont(): Promise<FontFace[]>;

/** Creates the player for an element's `data-asciinema` recording, once. */
export function mountCast<
  Player extends {
    seek(time: number): Promise<unknown>;
    play(): Promise<unknown>;
  },
>(
  create: (src: string, element: HTMLElement, options: Record<string, unknown>) => Player,
  element: HTMLElement,
  options?: Record<string, unknown>,
): Player | undefined;

/** Calls `callback` once, the first time `element` comes into view. */
export function whenVisible(
  element: Element,
  callback: () => void,
  options?: IntersectionObserverInit,
): () => void;
