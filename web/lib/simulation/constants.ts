/** Canvas size (square ASMR frame). */
export const WIDTH = 800;
export const HEIGHT = 800;
export const CENTER_X = WIDTH / 2;
export const CENTER_Y = HEIGHT / 2;

/**
 * Cinematic ASMR physics + scale — tweak here.
 * containerRadius = min(canvas.width, canvas.height) * containerRadiusFactor
 * ballRadius = containerRadius * ballRadiusFactor
 */
export const CINEMATIC_CONFIG = {
  gravity: 0.15,
  containerRadiusFactor: 0.45,
  ballRadiusFactor: 0.03,
  /** Drop: high and off-center for an angled first bounce */
  dropOffsetXFactor: 0.3,
  dropOffsetYFactor: -0.5,
  initialVelocityX: 2,
  initialVelocityY: 0,
  friction: 1,
  restitution: 0.98,
  minSpeed: 14,
  bottomVyThreshold: 2.5,
  bottomYKick: 6,
  /** Eraser brush scales with ball size */
  eraserStartFactor: 4,
  eraserEndFactor: 7.5,
  /** Full consume duration (seconds); ms = targetTime * 1000 */
  targetTime: 60,
  /** Exponent for radius growth curve (stay small, then swallow at end) */
  growthEasePower: 4,
  fps: 60,
  frameSkip: 2,
} as const;

export function scaleFromCanvas(
  canvasWidth = WIDTH,
  canvasHeight = HEIGHT,
): { containerRadius: number; ballRadius: number } {
  const containerRadius =
    Math.min(canvasWidth, canvasHeight) * CINEMATIC_CONFIG.containerRadiusFactor;
  const ballRadius = containerRadius * CINEMATIC_CONFIG.ballRadiusFactor;
  return { containerRadius, ballRadius };
}

export const FPS = CINEMATIC_CONFIG.fps;
export const FRAME_SKIP = CINEMATIC_CONFIG.frameSkip;
export const MIN_SPEED = CINEMATIC_CONFIG.minSpeed;
export const BOTTOM_VY_THRESHOLD = CINEMATIC_CONFIG.bottomVyThreshold;
export const BOTTOM_Y_KICK = CINEMATIC_CONFIG.bottomYKick;

/** @deprecated Use scaleFromCanvas().containerRadius */
export const BORDER_RADIUS = scaleFromCanvas().containerRadius;
/** @deprecated Use scaleFromCanvas().ballRadius */
export const RING_RADIUS = scaleFromCanvas().ballRadius;
