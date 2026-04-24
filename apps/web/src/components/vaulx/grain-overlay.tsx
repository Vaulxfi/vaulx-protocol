/**
 * Fixed-position SVG noise overlay. Applied globally in root layout.
 * Gives every surface a faint paper-texture — makes the editorial vibe land.
 * Server-component safe (pure markup, no client JS).
 */
export function GrainOverlay() {
  return <div aria-hidden className="vx-grain" />;
}
