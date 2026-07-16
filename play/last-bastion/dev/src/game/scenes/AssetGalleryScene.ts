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
    const batch = new URLSearchParams(window.location.search).get("batch");
    if (batch === "e1") {
      this.createBatchE1Gallery();
      return;
    }
    if (batch === "d2") {
      this.createBatchD2Gallery();
      return;
    }
    if (batch === "d") {
      this.createBatchDGallery();
      return;
    }
    if (batch === "c") {
      this.createBatchCGallery();
      return;
    }
    if (batch === "b") {
      this.createBatchBGallery();
      return;
    }
    if (batch === "a") {
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

  private createBatchBGallery(): void {
    this.add.text(20, 14, "LAST BASTION — PRODUCTION ASSET BATCH B", style("#ffffff", "17px"));
    this.add.text(20, 38, "63 runtime visuals • weapons, enemy escalation, boss identity, and authored effects", style("#8fb2c9", "11px"));

    this.add.text(20, 70, "WEAPONS", style("#ffd36b", "11px"));
    this.add.image(88, 104, "scattergun-v1").setScale(1.2);
    this.add.image(194, 104, "arc-carbine-v1").setScale(1.2);
    this.add.text(42, 126, "SCATTER", style("#ff9a72", "9px"));
    this.add.text(160, 126, "ARC", style("#68e4e8", "9px"));

    this.add.text(284, 70, "SLIME SPITTER — position / wind-up / recover × S N E W", style("#b9ef62", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const column = frame % 6;
      const row = Math.floor(frame / 6);
      this.add.sprite(320 + column * 66, 101 + row * 58, "slime-spitter-v1", frame).setScale(0.72);
    }
    this.add.image(900, 112, "siege-crusher-portrait-v1").setDisplaySize(86, 86);

    this.add.text(20, 186, "CARAPACE SCUTTLER — pursuit / wind-up / charge / recover × S N E W", style("#ff9a72", "11px"));
    for (let frame = 0; frame < 16; frame += 1) {
      const column = frame % 8;
      const row = Math.floor(frame / 8);
      this.add.sprite(64 + column * 112, 226 + row * 62, "carapace-scuttler-v1", frame).setScale(0.56);
    }

    this.add.text(20, 320, "SIEGE CRUSHER — stalk / charge / sweep × S N E W", style("#ffd36b", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const column = frame % 6;
      const row = Math.floor(frame / 6);
      this.add.sprite(72 + column * 142, 365 + row * 64, "siege-crusher-v1", frame).setScale(0.48);
    }

    this.add.text(20, 456, "BATCH B EFFECTS — weapon / arc / slime / Crusher, frames 0–19", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 20; frame += 1) {
      const x = 52 + frame * 45;
      this.add.sprite(x, 494, "batch-b-effects-v1", frame).setScale(0.48);
      this.add.text(x, 516, String(frame), style("#728ba1", "7px")).setOrigin(0.5);
    }
  }

  private createBatchCGallery(): void {
    this.add.text(20, 14, "LAST BASTION — PRODUCTION ASSET BATCH C", style("#ffffff", "17px"));
    this.add.text(20, 38, "60 gameplay-critical visuals • new enemies, rewards, powerups, statuses, fence, and ultimate", style("#8fb2c9", "11px"));

    this.add.text(20, 68, "BLAST MITE — chase / armed / detonation × S N E W", style("#ff9a52", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const column = frame % 6;
      const row = Math.floor(frame / 6);
      this.add.sprite(54 + column * 70, 104 + row * 54, "blast-mite-v1", frame).setScale(0.72);
    }

    this.add.text(470, 68, "WARP FLANKER — stalk / dissolve / materialise", style("#d696ff", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const column = frame % 6;
      const row = Math.floor(frame / 6);
      this.add.sprite(500 + column * 74, 104 + row * 54, "warp-flanker-v1", frame).setScale(0.5);
    }

    this.add.text(20, 204, "REWARDS + POWERUPS 4×4 — chest / depot / world pickup / HUD icon", style("#ffd36b", "11px"));
    for (let frame = 0; frame < 16; frame += 1) {
      const column = frame % 8;
      const row = Math.floor(frame / 8);
      const x = 58 + column * 112;
      const y = 246 + row * 66;
      this.add.sprite(x, y, "batch-c-rewards-v1", frame).setScale(0.72);
      this.add.text(x, y + 25, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 354, "BATCH C EFFECTS 5×4 — status / fence / barrage / mite + warp", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 20; frame += 1) {
      const column = frame % 10;
      const row = Math.floor(frame / 10);
      const x = 50 + column * 92;
      const y = 400 + row * 70;
      this.add.sprite(x, y, "batch-c-effects-v1", frame).setScale(0.68);
      this.add.text(x, y + 26, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 526, "Review: ?mode=gallery&batch=c • Gameplay: normal five-wave run", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchDGallery(): void {
    this.add.text(20, 14, "LAST BASTION — PRODUCTION ASSET BATCH D1", style("#ffffff", "17px"));
    this.add.text(20, 38, "23 Brood Warden runtime visuals • retained masters • fixed pivots • Steam-ready source pipeline", style("#8fb2c9", "11px"));

    this.add.text(20, 70, "BROOD WARDEN — stalk / attack / frenzy × S N E W", style("#b9ef62", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const column = frame % 6;
      const row = Math.floor(frame / 6);
      const x = 78 + column * 138;
      const y = 126 + row * 102;
      this.add.sprite(x, y, "brood-warden-v1", frame).setScale(0.68);
      this.add.text(x, y + 48, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 286, "BOSS PORTRAIT — HUD SIZE + SOURCE READABILITY", style("#d696ff", "11px"));
    this.add.image(82, 358, "brood-warden-portrait-v1").setDisplaySize(128, 128);
    this.add.image(188, 330, "brood-warden-portrait-v1").setDisplaySize(48, 48);

    this.add.text(280, 286, "EFFECTS 5×2 — acid / egg / cleave / rush / enrage / defeat", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 10; frame += 1) {
      const column = frame % 5;
      const row = Math.floor(frame / 5);
      const x = 340 + column * 112;
      const y = 340 + row * 90;
      this.add.sprite(x, y, "brood-warden-effects-v1", frame).setScale(0.9);
      this.add.text(x, y + 34, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 514, "Review: ?mode=gallery&batch=d • Encounter: ?scenario=brood-warden&loadout=vertical", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchD2Gallery(): void {
    this.add.text(20, 14, "LAST BASTION — RIPPER PRODUCTION ASSET BATCH D2", style("#ffffff", "17px"));
    this.add.text(20, 38, "24 runtime visuals • retained Steam-quality masters • fixed pivots and frame contracts", style("#8fb2c9", "11px"));

    this.add.text(20, 70, "RIPPER — pursuit / wind-up / sweep / exposed recovery × S N E W", style("#ff9a72", "11px"));
    for (let frame = 0; frame < 16; frame += 1) {
      const column = frame % 8;
      const row = Math.floor(frame / 8);
      const x = 66 + column * 116;
      const y = 130 + row * 116;
      this.add.sprite(x, y, "ripper-v1", frame).setScale(0.82);
      this.drawPivot(x, y);
      this.add.text(x, y + 46, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 318, "RIPPER EFFECTS — cone / wind-up / sweep / impact / recovery / spawn / hit / defeat", style("#ffd36b", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 64 + frame * 118;
      this.add.sprite(x, 386, "ripper-effects-v1", frame).setScale(1.15);
      this.drawPivot(x, 386);
      this.add.text(x, 430, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 492, "Coral telegraph → ivory active strike → cracked-thorax punish window", style("#ffb982", "11px")).setOrigin(0.5);
    this.add.text(480, 518, "Review: ?mode=gallery&batch=d2 • Encounter: ?scenario=ripper&loadout=vertical", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchE1Gallery(): void {
    this.add.text(20, 14, "LAST BASTION — QUILLBACK PRODUCTION ASSET BATCH E1", style("#ffffff", "17px"));
    this.add.text(20, 38, "20 runtime visuals • retained Steam-quality masters • exact code-driven fan geometry", style("#8fb2c9", "11px"));

    this.add.text(20, 70, "QUILLBACK — positioning / charged wind-up / exposed recovery × S N E W", style("#ffb06b", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const column = frame % 6;
      const row = Math.floor(frame / 6);
      const x = 92 + column * 152;
      const y = 132 + row * 124;
      this.add.sprite(x, y, "quillback-v1", frame).setScale(0.82);
      this.drawPivot(x, y);
      this.add.text(x, y + 48, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 326, "QUILLBACK EFFECTS — spike / charge / fan accents / impacts / hit / defeat", style("#ffd08a", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 64 + frame * 118;
      this.add.sprite(x, 400, "quillback-effects-v1", frame).setScale(1.12);
      this.drawPivot(x, 400);
      this.add.text(x, 444, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 490, "Ivory spike projectile remains separate; warning paths and collision use the same 64° runtime fan", style("#ffb982", "10px")).setOrigin(0.5);
    this.add.text(480, 518, "Review: ?mode=gallery&batch=e1 • Encounter: ?scenario=quillback&loadout=vertical", style("#8fb2c9", "10px")).setOrigin(0.5);
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
