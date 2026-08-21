import { describe, expect, it, vi } from "vitest";
import type Phaser from "phaser";
import { planDisplayPresentation } from "./DisplayPresentation";
import { applyDirectDisplayPresentation } from "./DirectDisplayPresentation";

describe("applyDirectDisplayPresentation", () => {
  it.each([
    [1920, 1080, 2],
    [3840, 2160, 4],
  ] as const)("keeps a 960x540 logical camera over a %sx%s backing store", (width, height, scale) => {
    const camera = {
      width,
      height,
      zoom: scale,
      originX: 0,
      originY: 0,
      worldView: { x: 0, y: 0, width: 960, height: 540 },
      setSize: vi.fn(),
      setZoom: vi.fn(),
      setOrigin: vi.fn(),
      setRoundPixels: vi.fn(),
    };
    camera.setSize.mockReturnValue(camera);
    camera.setZoom.mockReturnValue(camera);
    camera.setOrigin.mockReturnValue(camera);
    camera.setRoundPixels.mockReturnValue(camera);
    const canvas = { dataset: {} as Record<string, string> };
    const game = {
      canvas,
      scale: { resize: vi.fn(), setZoom: vi.fn() },
      scene: { getScenes: vi.fn(() => [{ cameras: { main: camera } }]) },
    } as unknown as Phaser.Game;
    const plan = planDisplayPresentation({
      windowWidth: width,
      windowHeight: height,
      devicePixelRatio: 1,
    });

    applyDirectDisplayPresentation(game, plan);

    expect(game.scale.resize).toHaveBeenCalledWith(width, height);
    expect(game.scale.setZoom).toHaveBeenCalledWith(1);
    expect(camera.setSize).toHaveBeenCalledWith(width, height);
    expect(camera.setZoom).toHaveBeenCalledWith(scale);
    expect(camera.setOrigin).toHaveBeenCalledWith(0);
    expect(JSON.parse(canvas.dataset.directPresentationAudit!)).toMatchObject({
      renderWidth: width,
      renderHeight: height,
      renderDeviceScale: scale,
    });
  });

  it("waits for an asynchronously loaded route scene", () => {
    const camera = {
      width: 1920, height: 1080, zoom: 2, originX: 0, originY: 0,
      worldView: { x: 0, y: 0, width: 960, height: 540 },
      setSize: vi.fn(), setZoom: vi.fn(), setOrigin: vi.fn(), setRoundPixels: vi.fn(),
    };
    camera.setSize.mockReturnValue(camera);
    camera.setZoom.mockReturnValue(camera);
    camera.setOrigin.mockReturnValue(camera);
    camera.setRoundPixels.mockReturnValue(camera);
    const callbacks: FrameRequestCallback[] = [];
    const scheduleFrame = vi.fn((callback: FrameRequestCallback) => callbacks.push(callback));
    const getScenes = vi.fn()
      .mockReturnValueOnce([])
      .mockReturnValue([{ cameras: { main: camera } }]);
    const game = {
      canvas: { dataset: {} as Record<string, string> },
      scale: { resize: vi.fn(), setZoom: vi.fn() },
      scene: { getScenes },
    } as unknown as Phaser.Game;

    applyDirectDisplayPresentation(game, planDisplayPresentation({
      windowWidth: 1920, windowHeight: 1080, devicePixelRatio: 1,
    }), scheduleFrame);
    expect(camera.setZoom).not.toHaveBeenCalled();
    callbacks.shift()?.(0);
    expect(camera.setZoom).toHaveBeenCalledWith(2);
  });
});
