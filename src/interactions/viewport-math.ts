import type { SceneBounds, ViewportSize, ViewportTransform } from "./viewport-types.js";

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 4;
export const FIT_PADDING = 24;
export const identityTransform: ViewportTransform = { scale: 1, translateX: 0, translateY: 0 };

export function fitTransform(
  scene: SceneBounds,
  viewport: ViewportSize,
  padding = FIT_PADDING,
): ViewportTransform | null {
  if (!validBounds(scene) || !validSize(viewport)) return null;
  const availableWidth = viewport.width - padding * 2;
  const availableHeight = viewport.height - padding * 2;
  if (availableWidth <= 0 || availableHeight <= 0) return null;
  const scale = clamp(Math.min(availableWidth / scene.width, availableHeight / scene.height));
  return sanitize({
    scale,
    translateX: (viewport.width - scene.width * scale) / 2 - scene.x * scale,
    translateY: (viewport.height - scene.height * scale) / 2 - scene.y * scale,
  });
}

export function panTransform(
  transform: ViewportTransform,
  deltaX: number,
  deltaY: number,
): ViewportTransform {
  return sanitize({
    ...transform,
    translateX: transform.translateX + deltaX,
    translateY: transform.translateY + deltaY,
  });
}

export function zoomAt(
  transform: ViewportTransform,
  point: { x: number; y: number },
  factor: number,
): ViewportTransform {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(factor) ||
    factor <= 0
  )
    return sanitize(transform);
  const scale = clamp(transform.scale * factor);
  const sceneX = (point.x - transform.translateX) / transform.scale;
  const sceneY = (point.y - transform.translateY) / transform.scale;
  return sanitize({
    scale,
    translateX: point.x - sceneX * scale,
    translateY: point.y - sceneY * scale,
  });
}

export function focusTransform(
  transform: ViewportTransform,
  viewport: ViewportSize,
  center: { x: number; y: number },
): ViewportTransform | null {
  if (!validSize(viewport) || !Number.isFinite(center.x) || !Number.isFinite(center.y)) return null;
  return sanitize({
    scale: transform.scale,
    translateX: viewport.width / 2 - center.x * transform.scale,
    translateY: viewport.height / 2 - center.y * transform.scale,
  });
}

export function sanitize(transform: ViewportTransform): ViewportTransform {
  return {
    scale: clamp(transform.scale),
    translateX: Number.isFinite(transform.translateX) ? transform.translateX : 0,
    translateY: Number.isFinite(transform.translateY) ? transform.translateY : 0,
  };
}
function clamp(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number.isFinite(value) ? value : 1));
}
function validSize(value: ViewportSize): boolean {
  return (
    Number.isFinite(value.width) &&
    Number.isFinite(value.height) &&
    value.width > 0 &&
    value.height > 0
  );
}
function validBounds(value: SceneBounds): boolean {
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.width) &&
    Number.isFinite(value.height) &&
    value.width > 0 &&
    value.height > 0
  );
}
