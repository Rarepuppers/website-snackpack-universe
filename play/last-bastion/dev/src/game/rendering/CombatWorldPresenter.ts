import Phaser from "phaser";
import type { DisplayPresentationPlan } from "./DisplayPresentation";
import { registerDisplayPresentationApplier } from "./DisplayPresentationRuntime";
import { BASE_HEIGHT, BASE_WIDTH } from "./DisplayScaling";
import { isWorldLayerCandidate, WORLD_LAYER_DEPTH_CEILING } from "./WorldLayerBoundary";
import { FramePacingTelemetry } from "../performance/FramePacingTelemetry";

/**
 * Opt-in T2.2 adapter. PrototypeScene's main camera remains a logical
 * 960x540 tracking camera; dedicated origin-zero cameras render and hit-test
 * the physical backing store. This avoids Phaser's follow/deadzone maths using
 * the physical viewport as world units when camera zoom is greater than one.
 */
export class CombatWorldPresenter {
  private readonly target: Phaser.GameObjects.RenderTexture;
  private readonly presentationCamera: Phaser.Cameras.Scene2D.Camera;
  private readonly hudCamera: Phaser.Cameras.Scene2D.Camera;
  private readonly ignoredByMain = new Set<Phaser.GameObjects.GameObject>();
  private readonly ignoredByPresentation = new Set<Phaser.GameObjects.GameObject>();
  private readonly ignoredByHud = new Set<Phaser.GameObjects.GameObject>();
  private readonly framePacing = new FramePacingTelemetry();
  private readonly contextRecovery = {
    probeRequested: false,
    extensionAvailable: false,
    contextLost: false,
    lostCount: 0,
    restoredCount: 0,
  };
  private contextLossTimer: number | null = null;
  private contextRestoreTimer: number | null = null;
  private plan: DisplayPresentationPlan | null = null;
  private readonly onContextLost = (): void => {
    this.contextRecovery.contextLost = true;
    this.contextRecovery.lostCount += 1;
    this.publishContextRecoveryAudit();
  };
  private readonly onContextRestored = (): void => {
    this.contextRecovery.contextLost = false;
    this.contextRecovery.restoredCount += 1;
    this.publishContextRecoveryAudit();
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stressProfile: 4 | 12 | null,
  ) {
    this.target = scene.add.renderTexture(0, 0, BASE_WIDTH, BASE_HEIGHT)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(WORLD_LAYER_DEPTH_CEILING - 0.5)
      .setRenderMode("all");

    this.presentationCamera = scene.cameras.add(0, 0, BASE_WIDTH, BASE_HEIGHT, false, "combat-world-presentation");
    this.hudCamera = scene.cameras.add(0, 0, BASE_WIDTH, BASE_HEIGHT, false, "combat-hud");
    this.presentationCamera.inputEnabled = false;
    this.hudCamera.inputEnabled = true;
    scene.cameras.main.inputEnabled = false;

    scene.cameras.main.ignore(this.target);
    this.hudCamera.ignore(this.target);
    scene.game.canvas.addEventListener("webglcontextlost", this.onContextLost);
    scene.game.canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    registerDisplayPresentationApplier((plan) => this.applyPlan(plan));
    this.update();
    this.scheduleContextRecoveryProbe();
  }

  update(): void {
    if (!this.plan) return;
    const main = this.scene.cameras.main;
    const scale = this.plan.renderDeviceScale;

    // Keep all existing follow, deadzone, worldView, and scene call-sites in
    // the original logical coordinate space.
    main.setSize(BASE_WIDTH, BASE_HEIGHT).setZoom(1).setOrigin(0.5).setRoundPixels(true);
    this.target.camera
      .setSize(this.plan.renderWidth, this.plan.renderHeight)
      .setOrigin(0)
      .setScroll(main.scrollX, main.scrollY)
      .setZoom(scale)
      .setRoundPixels(true);
    this.presentationCamera
      .setSize(this.plan.renderWidth, this.plan.renderHeight)
      .setOrigin(0)
      .setScroll(0, 0)
      .setZoom(1)
      .setRoundPixels(true);
    this.hudCamera
      .setSize(this.plan.renderWidth, this.plan.renderHeight)
      .setOrigin(0)
      .setScroll(main.scrollX, main.scrollY)
      .setZoom(scale)
      .setRoundPixels(true);
    const active = this.scene.children.list.filter((entry) => entry !== this.target && entry.active);
    const world = active.filter((entry) => isWorldLayerCandidate(entry));
    const hud = active.filter((entry) => !isWorldLayerCandidate(entry));
    this.ignoreNew(main, [...active, this.target], this.ignoredByMain);
    this.ignoreNew(this.presentationCamera, active, this.ignoredByPresentation);
    this.ignoreNew(this.hudCamera, [...world, this.target], this.ignoredByHud);

    this.target.clear();
    this.target.draw(world);

    const pointer = this.scene.input.activePointer;
    const pointerWorld = this.hudCamera.getWorldPoint(pointer.x, pointer.y);

    const audit = {
      mode: this.plan.mode,
      renderWidth: this.plan.renderWidth,
      renderHeight: this.plan.renderHeight,
      presentationWidth: this.plan.presentationWidth,
      presentationHeight: this.plan.presentationHeight,
      physicalWorldRect: this.plan.physicalWorldRect,
      renderDeviceScale: scale,
      workload: { stressProfile: this.stressProfile },
      framePacing: this.framePacing.snapshot(),
      contextRecovery: { ...this.contextRecovery },
      logicalCamera: { width: main.width, height: main.height, zoom: main.zoom },
      presentationCamera: {
        width: this.presentationCamera.width,
        height: this.presentationCamera.height,
        zoom: this.presentationCamera.zoom,
      },
      hudCamera: { width: this.hudCamera.width, height: this.hudCamera.height, zoom: this.hudCamera.zoom },
      target: { displayWidth: this.target.displayWidth, displayHeight: this.target.displayHeight },
      pointer: {
        x: pointer.x,
        y: pointer.y,
        worldX: pointer.worldX,
        worldY: pointer.worldY,
        inputWorldX: pointerWorld.x,
        inputWorldY: pointerWorld.y,
      },
    };
    (window as unknown as { __displayPresentationAudit?: object }).__displayPresentationAudit = audit;
    this.scene.game.canvas.dataset.presentationAudit = JSON.stringify(audit);
  }

  sampleFrame(deltaMilliseconds: number, suspended: boolean): void {
    this.framePacing.sample(deltaMilliseconds, suspended);
  }

  shake(durationMilliseconds: number, intensity: number): void {
    this.presentationCamera.shake(durationMilliseconds, intensity);
  }

  flash(durationMilliseconds: number, red: number, green: number, blue: number): void {
    this.presentationCamera.flash(durationMilliseconds, red, green, blue);
  }

  destroy(): void {
    registerDisplayPresentationApplier(null);
    if (this.contextLossTimer !== null) window.clearTimeout(this.contextLossTimer);
    if (this.contextRestoreTimer !== null) window.clearTimeout(this.contextRestoreTimer);
    this.scene.game.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.scene.game.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.scene.cameras.main.inputEnabled = true;
    this.scene.cameras.remove([this.presentationCamera, this.hudCamera]);
    this.target.destroy();
    this.ignoredByMain.clear();
    this.ignoredByPresentation.clear();
    this.ignoredByHud.clear();
  }

  private applyPlan(plan: DisplayPresentationPlan): void {
    this.plan = plan;
    this.target.resize(plan.renderWidth, plan.renderHeight);
    this.target.setDisplaySize(plan.renderWidth, plan.renderHeight);
    this.target.texture.setFilter(
      plan.sampling === "nearest" ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR,
    );
    this.scene.scale.resize(plan.renderWidth, plan.renderHeight);
    this.scene.scale.setZoom(plan.worldRect.width / plan.renderWidth);
  }

  private scheduleContextRecoveryProbe(): void {
    if (!import.meta.env.DEV || new URLSearchParams(window.location.search).get("contextloss") !== "1") return;
    this.contextRecovery.probeRequested = true;
    const renderer = this.scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    const extension = renderer.gl?.getExtension("WEBGL_lose_context");
    this.contextRecovery.extensionAvailable = extension !== null;
    this.publishContextRecoveryAudit();
    if (!extension) return;
    this.contextLossTimer = window.setTimeout(() => {
      extension.loseContext();
      this.contextRestoreTimer = window.setTimeout(() => extension.restoreContext(), 750);
    }, 1_000);
  }

  private publishContextRecoveryAudit(): void {
    this.scene.game.canvas.dataset.contextRecoveryAudit = JSON.stringify(this.contextRecovery);
  }

  private ignoreNew(
    camera: Phaser.Cameras.Scene2D.Camera,
    entries: readonly Phaser.GameObjects.GameObject[],
    seen: Set<Phaser.GameObjects.GameObject>,
  ): void {
    const additions = entries.filter((entry) => !seen.has(entry));
    if (additions.length === 0) return;
    camera.ignore(additions);
    additions.forEach((entry) => seen.add(entry));
  }
}
