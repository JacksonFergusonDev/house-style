/** The canvas's `--hs-field-*` properties, resolved. */
export interface FieldStyle {
  /** `--hs-field-color` (default the accent) as RGB channels, 0 to 255. */
  color: [number, number, number];
  /** `--hs-field-strength`, 0.36 unless a site overrides it. */
  strength: number;
  /** `--hs-field-blend`: `add` on dark pages, `normal` on light ones. */
  blend: 'add' | 'normal';
}

/** A site's drawing, which `runField` calls when it should draw. */
export interface FieldScene {
  /** Takes the canvas's style, on start and on `refresh()`. */
  style?(style: FieldStyle): void;
  /** Fits the drawing to the canvas's size in CSS pixels, on start and on resize. */
  resize?(width: number, height: number): void;
  /**
   * Draws a frame. `time` is the seconds the field has moved; `delta` is those
   * since the last frame, 0 when only redrawing a still frame.
   */
  draw(time: number, delta: number): void;
  /**
   * Rebuilds the drawing's GPU resources (shaders, buffers, textures) when a
   * lost WebGL context comes back. `runField` redraws after it returns.
   */
  restore?(): void;
  /** Frees the drawing, e.g. the GPU context. */
  dispose?(): void;
}

/** Controls for a running field. */
export interface Field {
  /** Re-reads the canvas's `--hs-field-*` properties and redraws, e.g. after a scheme change. */
  refresh(): void;
  /** Stops the animation and disposes the scene. */
  dispose(): void;
}

/** Calls `start` once the page has loaded and the browser is idle. */
export function afterLoad(start: () => void): void;

/**
 * Runs a hero's moving background on `canvas`, with `button` as its pause
 * control: still for reduced motion, paused off screen or in a hidden tab.
 * Returns nothing when the canvas has left the page.
 */
export function runField(
  canvas: HTMLCanvasElement,
  button: HTMLButtonElement,
  scene: FieldScene,
): Field | undefined;

/** Resolves any CSS colour to its RGB channels, 0 to 255. */
export function resolveColor(value: string): [number, number, number];
