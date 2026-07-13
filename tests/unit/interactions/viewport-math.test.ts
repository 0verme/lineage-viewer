import { describe, expect, it } from "vitest";
import {
  fitTransform,
  fitBoundsTransform,
  focusTransform,
  panTransform,
  unionBounds,
  zoomAt,
} from "../../../src/interactions/viewport-math.js";

describe("viewport math", () => {
  it("fits and centers a scene with padding", () => {
    expect(
      fitTransform({ x: 0, y: 0, width: 400, height: 100 }, { width: 800, height: 400 }),
    ).toEqual({ scale: 1.88, translateX: 24, translateY: 106 });
  });
  it("fits non-symmetrical bounds with explicit padding and scale limits", () => {
    expect(
      fitBoundsTransform(
        { x: 100, y: 20, width: 400, height: 200 },
        { width: 1000, height: 600 },
        { padding: 50, maxScale: 1 },
      ),
    ).toEqual({ scale: 1, translateX: 200, translateY: 180 });
  });
  it("unions multiple node bounds and ignores invalid values", () => {
    expect(
      unionBounds([
        { x: 100, y: 20, width: 40, height: 30 },
        { x: 10, y: 50, width: 20, height: 100 },
        { x: 0, y: 0, width: 0, height: 20 },
      ]),
    ).toEqual({ x: 10, y: 20, width: 130, height: 130 });
    expect(unionBounds([])).toBeNull();
  });
  it("keeps the zoom anchor on the same scene coordinate", () => {
    const before = { scale: 1, translateX: 10, translateY: 20 };
    const after = zoomAt(before, { x: 110, y: 120 }, 2);
    expect((110 - after.translateX) / after.scale).toBe(100);
    expect((120 - after.translateY) / after.scale).toBe(100);
  });
  it("keeps transforms finite for invalid viewport input", () => {
    expect(fitTransform({ x: 0, y: 0, width: 1, height: 1 }, { width: 0, height: 40 })).toBeNull();
    expect(panTransform({ scale: 1, translateX: 1, translateY: 2 }, 3, 4)).toEqual({
      scale: 1,
      translateX: 4,
      translateY: 6,
    });
    expect(
      focusTransform(
        { scale: 2, translateX: 0, translateY: 0 },
        { width: 100, height: 80 },
        { x: 10, y: 10 },
      ),
    ).toEqual({ scale: 2, translateX: 30, translateY: 20 });
  });
  it("honors an explicit fit scale floor when requested", () => {
    expect(
      fitBoundsTransform(
        { x: 0, y: 0, width: 1000, height: 1000 },
        { width: 500, height: 500 },
        { minScale: 0.8 },
      )?.scale,
    ).toBe(0.8);
  });
});
