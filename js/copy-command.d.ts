// Generated from src/ by pnpm run build. Do not edit.
/**
 * Wires every install box under `root` (see css/install.css).
 *
 * A tab with `data-command` puts its command into the install box named by its
 * `aria-controls`. A button with `data-copy` copies that text, says so for a
 * moment, and then shows its original label again. Calling this again on the
 * same page binds nothing twice.
 */
export declare function initCopyCommands(root?: ParentNode): void;
