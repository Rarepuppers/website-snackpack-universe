import Phaser from "phaser";
import { loadGameAssets } from "../assets/PhaserAssetLoader";
import { GAME_ASSETS } from "../assets/GameAssetManifest";
import { calculateWeaponRingLayout } from "../equipment/WeaponRingLayout";

export class AssetGalleryScene extends Phaser.Scene {
  constructor() {
    super("asset-gallery");
  }

  preload(): void {
    loadGameAssets(this);
  }

  create(): void {
    this.add.rectangle(480, 270, 960, 540, 0x111a25);
    if (new URLSearchParams(window.location.search).get("batch") === "a") {
      this.createBatchAGallery();
      return;
    }
    this.add.text(20, 14, "LAST BASTION — PRODUCTION ART DEBUG GALLERY", style("#ffffff", "17px"));
    this.add.text(20, 38, "Every frame uses manifest scale and pivot.  Return with ?art=marine", style("#8fb2c9", "11px"));

    this.add.text(20, 66, "MARINE BODY + HELMET — idle / move / dodge × S N E W", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const x = 55 + frame * 73;
      const y = 128;
      const body = this.add.sprite(x, y, "marine-base-v1", frame).setScale(0.68);
      const helmet = this.add.sprite(x, y, "marine-helmet-v1", frame).setScale(0.68);
      setManifestOrigin(body, "marine-base-v1");
      setManifestOrigin(helmet, "marine-helmet-v1");
      this.drawPivot(x, y);
      this.add.text(x, 170, String(frame), style("#728ba1", "9px")).setOrigin(0.5);
    }

    this.add.text(20, 188, "SCUTTLER — gait A/B × S N E W", style("#ff9a72", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 52 + frame * 68;
      this.add.sprite(x, 235, "scuttler-v1", frame);
      this.drawPivot(x, 235);
    }

    this.add.text(588, 188, "SERVICE RIFLE + RING CAPACITY", style("#ffd36b", "11px"));
    this.drawWeaponRing(650, 242, 1, 0.66);
    this.drawWeaponRing(760, 242, 4, 0.66);
    this.drawWeaponRing(880, 242, 12, 0.5);

    this.add.text(20, 286, "EGG CLUSTER — dormant / pulse / cracked / empty", style("#ff9a72", "11px"));
    for (let frame = 0; frame < 4; frame += 1) {
      const x = 62 + frame * 82;
      this.add.sprite(x, 340, "egg-cluster-v1", frame);
      this.drawPivot(x, 340);
    }

    this.add.text(414, 286, "BRAIN BLOB — drift / wind-up / lunge / recover", style("#d696ff", "11px"));
    for (let frame = 0; frame < 4; frame += 1) {
      const x = 468 + frame * 100;
      this.add.sprite(x, 340, "brain-blob-v1", frame);
      this.drawPivot(x, 340);
    }

    this.add.rectangle(480, 444, 920, 126, 0x0b121c, 0.9).setStrokeStyle(2, 0x405a72);
    this.add.text(36, 394, "MANIFEST CONTRACT", style("#68e4e8", "11px"));
    const lines = Object.values(GAME_ASSETS).map((asset) => (
      `${asset.id.padEnd(20)} ${asset.kind.padEnd(11)} ${asset.logicalWidth}×${asset.logicalHeight} pivot ${asset.pivot.x.toFixed(2)},${asset.pivot.y.toFixed(2)}`
    ));
    this.add.text(42, 414, lines.slice(0, 3).join("\n"), style("#aebed0", "10px"));
    this.add.text(500, 414, lines.slice(3).join("\n"), style("#aebed0", "10px"));
    this.add.text(480, 516, "Debug cross = runtime pivot • ?stress=4 normal readability • ?stress=12 capacity", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchAGallery(): void {
    this.add.text(20, 14, "LAST BASTION — PRODUCTION ASSET BATCH A", style("#ffffff", "17px"));
    this.add.text(20, 38, "52 runtime frames • fixed atlas contracts • text remains live UI", style("#8fb2c9", "11px"));

    this.add.text(20, 68, "FLOOR 3×2", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 6; frame += 1) {
      this.add.sprite(48 + frame * 62, 115, "arena-floor-v1", frame).setScale(0.78);
    }
    this.add.text(410, 68, "BOUNDARIES 4×2", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      this.add.sprite(438 + frame * 62, 115, "arena-boundary-v1", frame).setScale(0.78);
    }

    this.add.text(20, 162, "OBSTACLES — intact 0–3 / damaged 4–7", style("#ffd36b", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      this.add.sprite(58 + frame * 104, 220, "arena-obstacle-v1", frame).setScale(0.72);
      this.add.text(58 + frame * 104, 260, String(frame), style("#728ba1", "9px")).setOrigin(0.5);
    }

    this.add.text(20, 282, "COMBAT EFFECTS 5×4 — frames 0–19", style("#ff9a72", "11px"));
    for (let frame = 0; frame < 20; frame += 1) {
      const column = frame % 10;
      const row = Math.floor(frame / 10);
      const x = 48 + column * 54;
      const y = 326 + row * 46;
      this.add.sprite(x, y, "combat-effects-v1", frame).setScale(0.62);
      this.add.text(x, y + 19, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(580, 282, "PICKUPS 0–3", style("#d696ff", "11px"));
    for (let frame = 0; frame < 4; frame += 1) {
      this.add.sprite(610 + frame * 78, 333, "pickups-v1", frame).setScale(0.75);
    }

    this.add.text(580, 382, "HUD PANELS 3×2", style("#d696ff", "11px"));
    for (let frame = 0; frame < 6; frame += 1) {
      const column = frame % 3;
      const row = Math.floor(frame / 3);
      this.add.sprite(642 + column * 145, 427 + row * 72, "hud-panels-v1", frame)
        .setDisplaySize(130, 65);
    }

    this.add.text(20, 500, "Review: ?mode=gallery&batch=a  •  Gameplay: remove mode  •  Fallback: ?art=placeholder", style("#8fb2c9", "10px"));
  }

  private drawWeaponRing(x: number, y: number, count: number, scale: number): void {
    const slots = calculateWeaponRingLayout(count);
    for (const slot of slots) {
      this.add.image(x + slot.x * 30, y + slot.y * 30, "service-rifle-v1")
        .setOrigin(0.25, 0.5).setScale(scale);
    }
    this.add.circle(x, y, 10, 0x253d5f).setStrokeStyle(2, 0xe9e3cf);
    this.add.text(x, y + 43, String(count), style("#ffffff", "10px")).setOrigin(0.5);
  }

  private drawPivot(x: number, y: number): void {
    const marker = this.add.graphics().setDepth(100);
    marker.lineStyle(1, 0x68e4e8, 0.9);
    marker.lineBetween(x - 3, y, x + 3, y);
    marker.lineBetween(x, y - 3, x, y + 3);
  }
}

function setManifestOrigin(sprite: Phaser.GameObjects.Sprite, id: "marine-base-v1" | "marine-helmet-v1"): void {
  const asset = GAME_ASSETS[id];
  sprite.setOrigin(asset.pivot.x, asset.pivot.y);
}

function style(color: string, fontSize: string): Phaser.Types.GameObjects.Text.TextStyle {
  return { color, fontFamily: "monospace", fontSize };
}
