// Generated from src/ by npm run build. Do not edit.
/**
 * Runs a hero's moving background: everything about it but the drawing.
 *
 * A site draws its own field on the `.hs-field` canvas, with WebGL or a 2D
 * context, and hands its drawing to `runField`, which follows GUIDELINES.md's
 * motion rules: still for reduced motion, paused off screen or in a hidden
 * tab, and stoppable with its pause button (css/site.css, `.hs-motion`). Start
 * it with `afterLoad`, so the first screen paints as text:
 *
 *   afterLoad(() => {
 *     const gl = canvas.getContext('webgl2');
 *     if (gl) runField(canvas, button, myScene(gl));
 *   });
 *
 * The canvas's CSS sets the drawing's style: `--hs-field-color` (default the
 * accent), `--hs-field-strength` (0.36), and `--hs-field-blend` (`add` on dark
 * pages, `normal` on light ones). Call `refresh()` after changing them.
 *
 * A WebGL canvas can lose its context when the GPU resets or a phone reclaims
 * memory. `runField` asks the browser to restore it, draws nothing while it's
 * gone, and calls the scene's `restore()` to rebuild its shaders and buffers
 * before drawing again.
 */
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
/**
 * Calls `start` once the page has loaded and the browser is idle, or a second
 * after load at the latest.
 */
export declare function afterLoad(start: () => void): void;
/**
 * Runs `scene` on `canvas`, with `button` as its pause control.
 *
 * The scene draws; `runField` decides when. `draw(time, delta)` gets the
 * seconds the field has moved and those since the last frame, which is 0 when
 * it only redraws a still frame (paused, resized, or restyled). `restore()`
 * runs when a lost WebGL context comes back, before the next frame.
 *
 * Returns nothing when the canvas has left the page.
 */
export declare function runField(
  canvas: HTMLCanvasElement,
  button: HTMLButtonElement,
  scene: FieldScene,
): Field | undefined;
/**
 * Resolves any CSS colour (relative colours, `color-mix()`) to its RGB
 * channels, 0 to 255, through a probe element's computed colour.
 */
export declare function resolveColor(value: string): [number, number, number];
