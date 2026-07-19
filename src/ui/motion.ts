/** Motion preference is read once at boot so every Phaser scene agrees. */
export const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Collapse decorative travel while leaving a tiny causal beat for game state. */
export function motionMs(normal: number, reduced = 24): number {
  return REDUCED_MOTION ? reduced : normal;
}
