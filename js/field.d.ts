/** Controls for a running field. */
export interface Field {
  /** Re-reads the canvas's `--hs-field-*` properties and redraws, e.g. after a scheme change. */
  refresh(): void;
  /** Stops the animation and frees the GPU. */
  dispose(): void;
}

/**
 * Starts a hero's moving background on `canvas`, with `button` as its pause
 * control. Pass in the three.js module. Returns nothing when the browser has
 * no WebGL, leaving the hero's plain background.
 */
export function startField(
  three: unknown,
  canvas: HTMLCanvasElement,
  button: HTMLButtonElement,
): Field | undefined;
