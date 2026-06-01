import type { StudioConfig } from "./simulation/types";

export function computeRenderId(config: StudioConfig): string {
  const payload = JSON.stringify({
    watermarkText: config.watermarkText,
    watermarkOpacity: Math.round(config.watermarkOpacity * 100) / 100,
    baseHue: Math.round(config.baseHue * 1000) / 1000,
    ballHue: Math.round(config.ballHue * 1000) / 1000,
    targetTime: config.targetTime,
    ringRadius: config.ringRadius,
    borderRadius: config.borderRadius,
    initialSpeed: config.initialSpeed,
    finalSpeed: config.finalSpeed,
    gravity: config.gravity,
    friction: config.friction,
    restitution: config.restitution,
    eraserStart: config.eraserStart,
    eraserEnd: config.eraserEnd,
    jitterStart: config.jitterStart,
    jitterEnd: config.jitterEnd,
    seed: config.seed,
  });
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    h = (Math.imul(31, h) + payload.charCodeAt(i)) | 0;
  }
  return `render_${Math.abs(h).toString(36)}`;
}
