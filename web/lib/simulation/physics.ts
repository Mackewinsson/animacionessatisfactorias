import { CENTER_X, CENTER_Y } from "./constants";
import { CINEMATIC_CONFIG, MIN_SPEED } from "./constants";
import type { StudioConfig } from "./types";

/** Normalized progress 0–1 → ball radius with exponential ease toward container size. */
export function computeDynamicRadius(
  progress: number,
  initialBallRadius: number,
  containerRadius: number,
  easePower = CINEMATIC_CONFIG.growthEasePower,
): number {
  const p = Math.min(Math.max(progress, 0), 1);
  const easeProgress = Math.pow(p, easePower);
  return (
    initialBallRadius +
    (containerRadius - initialBallRadius) * easeProgress
  );
}

export function targetDurationMs(config: StudioConfig): number {
  return config.targetTime * 1000;
}

/**
 * After a wall bounce: clamp speed to minSpeed and nudge upward if stuck on the bottom.
 */
export function applyEnergyInjection(
  velX: number,
  velY: number,
  ballX: number,
  ballY: number,
  borderRadius: number,
  ballRadius: number,
  minSpeedLimit: number = MIN_SPEED,
): { velX: number; velY: number } {
  let vx = velX;
  let vy = velY;
  let speed = Math.sqrt(vx * vx + vy * vy);

  if (speed > 1e-6 && speed < minSpeedLimit) {
    vx = (vx / speed) * minSpeedLimit;
    vy = (vy / speed) * minSpeedLimit;
  } else if (speed <= 1e-6) {
    vx = minSpeedLimit * 0.6;
    vy = -minSpeedLimit * 0.75;
  }

  const maxDist = borderRadius - ballRadius;
  const inLowerArena = ballY > CENTER_Y + maxDist * 0.2;
  if (inLowerArena && Math.abs(vy) < CINEMATIC_CONFIG.bottomVyThreshold) {
    vy -= CINEMATIC_CONFIG.bottomYKick;
  }

  return { velX: vx, velY: vy };
}

/**
 * Realistic circular boundary + energy injection so motion never dies out.
 */
export function resolveCircleCollision(
  ballX: number,
  ballY: number,
  velX: number,
  velY: number,
  containerRadius: number,
  ballRadius: number,
  restitution: number,
  minSpeedLimit: number = MIN_SPEED,
): {
  ballX: number;
  ballY: number;
  velX: number;
  velY: number;
  collided: boolean;
} {
  const dx = ballX - CENTER_X;
  const dy = ballY - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = containerRadius - ballRadius;

  if (dist <= maxDist || dist === 0) {
    return { ballX, ballY, velX, velY, collided: false };
  }

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = dist - maxDist;
  const correctedX = ballX - nx * overlap;
  const correctedY = ballY - ny * overlap;

  const dot = velX * nx + velY * ny;
  let newVx = velX - 2 * dot * nx;
  let newVy = velY - 2 * dot * ny;
  newVx *= restitution;
  newVy *= restitution;

  const injected = applyEnergyInjection(
    newVx,
    newVy,
    correctedX,
    correctedY,
    containerRadius,
    ballRadius,
    minSpeedLimit,
  );

  return {
    ballX: correctedX,
    ballY: correctedY,
    velX: injected.velX,
    velY: injected.velY,
    collided: true,
  };
}

/** Keeps motion alive between bounces (gravity bleed). */
export function enforceMinimumMotion(
  velX: number,
  velY: number,
  ballX: number,
  ballY: number,
  borderRadius: number,
  ballRadius: number,
  minSpeedLimit: number = MIN_SPEED,
): { velX: number; velY: number } {
  return applyEnergyInjection(
    velX,
    velY,
    ballX,
    ballY,
    borderRadius,
    ballRadius,
    minSpeedLimit,
  );
}

/** Cinematic drop: high, off-center, from rest with slight horizontal drift. */
export function createDropInitialState(config: StudioConfig): {
  ballX: number;
  ballY: number;
  velX: number;
  velY: number;
} {
  const maxDist = config.borderRadius - config.ringRadius - 15;
  const spawnAngle = Math.random() * Math.PI * 2;
  const spawnDist = Math.random() * maxDist;
  const launchAngle = Math.random() * Math.PI * 2;
  
  return {
    ballX: CENTER_X + Math.cos(spawnAngle) * spawnDist,
    ballY: CENTER_Y + Math.sin(spawnAngle) * spawnDist,
    velX: config.initialSpeed * Math.cos(launchAngle),
    velY: config.initialSpeed * Math.sin(launchAngle),
  };
}
