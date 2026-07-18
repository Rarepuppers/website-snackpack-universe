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
    if (batch === "j2") {
      this.createBatchJ2Gallery();
      return;
    }
    if (batch === "j1") {
      this.createBatchJ1Gallery();
      return;
    }
    if (batch === "i3") {
      this.createBatchI3Gallery();
      return;
    }
    if (batch === "i2") {
      this.createBatchI2Gallery();
      return;
    }
    if (batch === "i") {
      this.createBatchIGallery();
      return;
    }
    if (batch === "n2") {
      this.createScrapShopGallery();
      return;
    }
    if (batch === "n") {
      this.createBatchNGallery();
      return;
    }
    if (batch === "k") {
      this.createBatchKGallery();
      return;
    }
    if (batch === "eh") {
      this.createEventHorizonGallery();
      return;
    }
    if (batch === "m") {
      this.createCorruptedHumanGallery();
      return;
    }
    if (batch === "h") {
      this.createEmberfallGallery();
      return;
    }
    if (batch === "tb") {
      this.createToxicBloomGallery();
      return;
    }
    if (batch === "va") {
      this.createWorldVariantGallery("VOID APPROACH", "void-approach-floor-v1", "void-approach-boundary-v1", "void-approach-obstacles-v1", "void-approach-decals-v1", "#9d8cff");
      return;
    }
    if (batch === "ar") {
      this.createWorldVariantGallery("ARCTIC RELAY", "arctic-relay-floor-v1", "arctic-relay-boundary-v1", "arctic-relay-obstacles-v1", "arctic-relay-decals-v1", "#bfe9ff");
      return;
    }
    if (batch === "f4") {
      this.createWeaponBatchGallery("GRENADE TUBE", "F4", "grenade-tube-v1", "grenade-tube-effects-v1", 2, "?loadout=grenade");
      return;
    }
    if (batch === "f3") {
      this.createWeaponBatchGallery("BULWARK ROTARY CANNON", "F3", "bulwark-rotary-cannon-v1", "bulwark-rotary-effects-v1", 1, "?loadout=bulwark");
      return;
    }
    if (batch === "f2") {
      this.createWeaponBatchGallery("BOLT CARBINE", "F2", "bolt-carbine-v1", "bolt-carbine-effects-v1", 0, "?loadout=bolt");
      return;
    }
    if (batch === "f1") {
      this.createBatchF1Gallery();
      return;
    }
    if (batch === "d4") {
      this.createBatchD4Gallery();
      return;
    }
    if (batch === "e3") {
      this.createBatchE3Gallery();
      return;
    }
    if (batch === "e2") {
      this.createBatchE2Gallery();
      return;
    }
    if (batch === "e1") {
      this.createBatchE1Gallery();
      return;
    }
    if (batch === "d3") {
      this.createBatchD3Gallery();
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

  private createBatchIGallery(): void {
    this.add.text(20, 18, "PRODUCTION BATCH I1 — 128 PX TILE PROMOTION", style("#f4dfb8", "18px"));
    this.add.text(20, 46, "Transparent runtime atlases • code-owned text, cooldowns, bindings, tiers, and selection", style("#8fb2c9", "11px"));
    const families = [
      { id: "batch-i-weapon-tiles-v1", label: "WEAPONS" },
      { id: "batch-i-perk-tiles-v1", label: "PERKS" },
      { id: "batch-i-hotkey-tiles-v1", label: "HOTKEY / ACTION" },
    ] as const;
    families.forEach((family, row) => {
      const y = 128 + row * 156;
      this.add.text(20, y - 54, family.label, style("#68e4e8", "11px"));
      for (let frame = 0; frame < 8; frame += 1) {
        this.add.sprite(92 + frame * 108, y, family.id, frame).setDisplaySize(92, 92);
      }
    });
    this.add.text(480, 522, "Review: ?mode=gallery&batch=i • Live placement: ?scenario=weapon-gate", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchI2Gallery(): void {
    this.add.text(20, 18, "PRODUCTION BATCH I2 — SLOT / TIER / MERGE", style("#f4dfb8", "18px"));
    this.add.text(20, 46, "Class identity survives grayscale • interaction overlays remain code-owned", style("#8fb2c9", "11px"));
    for (let frame = 0; frame < 16; frame += 1) {
      const column = frame % 8;
      const row = Math.floor(frame / 8);
      const x = 82 + column * 114;
      const y = 150 + row * 190;
      this.add.sprite(x, y, "batch-i-slot-tier-ui-v1", frame).setDisplaySize(104, 104);
      this.add.text(x, y + 66, String(frame), style("#8fb2c9", "9px")).setOrigin(0.5);
    }
    this.add.text(480, 520, "0–4 rack classes • 5 stash • 6–8 tiers • 9–11 discard • 12–14 merge/drag", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchI3Gallery(): void {
    this.add.text(20, 18, "PRODUCTION BATCH I3 — PLACEMENT / SHOP SURFACES", style("#f4dfb8", "18px"));
    this.add.image(260, 185, "batch-i-placement-modal-v1").setDisplaySize(450, 280);
    this.add.image(565, 180, "batch-i-weapon-stat-card-v1").setDisplaySize(160, 210);
    this.add.image(755, 342, "batch-i-shop-counter-v1").setDisplaySize(360, 210);
    for (let frame = 0; frame < 3; frame += 1) {
      this.add.sprite(520 + frame * 62, 330, "batch-i-shop-glyphs-v1", frame).setDisplaySize(48, 48);
    }
    this.add.text(20, 350, "LIVE PLACEMENT", style("#68e4e8", "11px"));
    this.add.text(20, 372, "?scenario=weapon-gate", style("#dce8f2", "13px"));
    this.add.text(480, 520, "All labels, stats, prices, bindings, selection, and legality render from code", style("#8fb2c9", "10px")).setOrigin(0.5);
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

  private createBatchD3Gallery(): void {
    this.add.text(20, 14, "LAST BASTION — BASTION EATER PRODUCTION ASSET BATCH D3", style("#ffffff", "17px"));
    this.add.text(20, 38, "41 final-boss visuals • layered node windows • three combat phases • reusable victory set", style("#8fb2c9", "11px"));

    this.add.text(20, 68, "PORTRAIT", style("#56d9e8", "10px"));
    this.add.image(88, 154, "bastion-eater-portrait-v1").setDisplaySize(128, 128);
    this.add.text(174, 68, "BODY — breach / brood / last stand × four animation phases", style("#d7a760", "10px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const x = 222 + (frame % 6) * 140;
      const y = 120 + Math.floor(frame / 6) * 116;
      this.add.sprite(x, y, "bastion-eater-v1", frame).setScale(0.5);
      this.drawPivot(x, y);
    }

    this.add.text(20, 260, "NODE STATES — closed / exposed", style("#56d9e8", "10px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 74 + frame * 116;
      this.add.sprite(x, 304, "bastion-eater-nodes-v1", frame).setScale(0.42);
    }

    this.add.text(20, 350, "BOSS EFFECTS 4×3", style("#d7a760", "10px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const x = 48 + (frame % 6) * 78;
      const y = 396 + Math.floor(frame / 6) * 70;
      this.add.sprite(x, y, "bastion-eater-effects-v1", frame).setScale(0.62);
    }

    this.add.text(526, 350, "BREACH + VICTORY OBJECTS 4×2", style("#56d9e8", "10px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 566 + (frame % 4) * 108;
      const y = 400 + Math.floor(frame / 4) * 78;
      this.add.sprite(x, y, "bastion-eater-environment-v1", frame).setScale(0.72);
    }
    this.add.text(480, 522, "Review: ?mode=gallery&batch=d3 • Encounter: ?scenario=bastion-eater&loadout=vertical", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchD4Gallery(): void {
    this.add.text(20, 14, "LAST BASTION — RAZOR SCUTTLER PRODUCTION ASSET BATCH D4", style("#ffffff", "17px"));
    this.add.text(20, 38, "24 runtime visuals • retained Steam-quality masters • exact code-driven dash geometry", style("#8fb2c9", "11px"));

    this.add.text(20, 70, "RAZOR SCUTTLER — pursuit / compressed wind-up / committed dash / recovery × S N E W", style("#ff9a72", "11px"));
    for (let frame = 0; frame < 16; frame += 1) {
      const x = 66 + (frame % 8) * 116;
      const y = 130 + Math.floor(frame / 8) * 116;
      this.add.sprite(x, y, "razor-scuttler-v1", frame).setScale(0.82);
      this.drawPivot(x, y);
      this.add.text(x, y + 46, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 318, "EFFECTS — lane accent / launch / trail / Marine hit / cover crash / miss skid / stagger / defeat", style("#68e4e8", "10px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 64 + frame * 118;
      this.add.sprite(x, 390, "razor-scuttler-effects-v1", frame).setScale(1.12);
      this.drawPivot(x, 390);
      this.add.text(x, 434, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 486, "Authored accents reinforce warning and outcome; lane, distance, collision, and hit test remain authoritative code", style("#ffb982", "9px")).setOrigin(0.5);
    this.add.text(480, 518, "Review: ?mode=gallery&batch=d4 • Encounter: ?scenario=razor-scuttler&loadout=vertical", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchNGallery(): void {
    this.add.text(20, 14, "LAST BASTION — TASK 36 AURUM + 128 PX TILE BATCH", style("#ffffff", "17px"));
    this.add.text(20, 38, "28 runtime visuals • retained generation masters • code-owned economy, timers, bindings, and escape geometry", style("#8fb2c9", "11px"));

    this.add.text(20, 68, "AURUM HOARDER — intact forage / armour-broken forage / flee × S N E W", style("#ffd36b", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const x = 78 + frame * 73;
      this.add.sprite(x, 126, "aurum-hoarder-v1", frame).setScale(0.68);
      this.drawPivot(x, 126);
      this.add.text(x, 166, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 198, "EVENT EFFECTS — arrival / break / Scrap / flee / trail / escape / defeat / cache", style("#68e4e8", "10px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 64 + frame * 118;
      this.add.sprite(x, 254, "aurum-hoarder-effects-v1", frame).setScale(1.05);
      this.drawPivot(x, 254);
      this.add.text(x, 296, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 328, "128 PX TILES — Scrap / cache / Codex / event / break / escape / Shop / locked", style("#ffb982", "10px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 64 + frame * 118;
      this.add.sprite(x, 410, "aurum-tiles-v1", frame).setScale(0.58);
      this.drawPivot(x, 410);
      this.add.text(x, 456, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 500, "Review: ?mode=gallery&batch=n • Encounter: ?scenario=aurum-hoarder&loadout=bulwark", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchJ1Gallery(): void {
    this.add.text(20, 14, "LAST BASTION — PRODUCTION BATCH J1 SPEED-TIER ENEMIES", style("#ffffff", "17px"));
    this.add.text(20, 38, "52 runtime body frames • simulation-owned movement, attacks, timing, collision, and cadence", style("#8fb2c9", "11px"));

    this.add.text(20, 66, "SWARM SCUTTLER — pursuit / pack rush × S N E W", style("#ff9a72", "10px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 48 + frame * 57;
      this.add.sprite(x, 112, "swarm-scuttler-v1", frame).setScale(0.65);
      this.add.text(x, 146, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(500, 66, "RAZORLORD — pursuit / wind-up / dash / recovery", style("#d696ff", "10px"));
    for (let frame = 0; frame < 16; frame += 1) {
      const x = 524 + (frame % 8) * 54;
      const y = 105 + Math.floor(frame / 8) * 62;
      this.add.sprite(x, y, "razorlord-v1", frame).setScale(0.46);
    }

    this.add.text(20, 205, "BLIGHTSPITTER — running position / gland wind-up / recovery", style("#b9f35b", "10px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const x = 52 + (frame % 6) * 75;
      const y = 258 + Math.floor(frame / 6) * 74;
      this.add.sprite(x, y, "blightspitter-v1", frame).setScale(0.56);
    }

    this.add.text(500, 205, "QUILLBACK MATRIARCH — position / crown / launch / recovery", style("#ffb982", "10px"));
    for (let frame = 0; frame < 16; frame += 1) {
      const x = 530 + (frame % 4) * 105;
      const y = 263 + Math.floor(frame / 4) * 64;
      this.add.sprite(x, y, "quillback-matriarch-v1", frame).setScale(0.43);
    }
    this.add.text(480, 520, "Review: ?mode=gallery&batch=j1 • Live identities enter waves 2 and 4–9", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchJ2Gallery(): void {
    this.add.text(20, 14, "LAST BASTION — PRODUCTION BATCH J2 TELEGRAPH DECALS", style("#ffffff", "17px"));
    this.add.text(20, 38, "24 hostile-warm frames • code geometry remains visible and authoritative beneath every raster accent", style("#8fb2c9", "11px"));
    this.add.text(20, 66, "LARGE — slam 25/50/75/100 • 120° sweep 25/50/75/100", style("#ffb982", "10px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 70 + frame * 118;
      this.add.sprite(x, 138, "telegraph-large-v1", frame).setScale(0.65).setAlpha(0.9);
    }
    this.add.text(20, 214, "SMALL — rain reticle • radial pulse • edge marker • beam • spine impact", style("#ff9a72", "10px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const x = 52 + frame * 78;
      this.add.sprite(x, 266, "telegraph-small-v1", frame).setScale(0.82);
    }
    this.add.text(20, 320, "FIVE-ARENA CONTRAST STRIP — base / Emberfall / Toxic Bloom / Void Approach / Arctic Relay", style("#ffd36b", "10px"));
    const themes = [
      { color: 0x263443, texture: "arena-floor-v1" },
      { color: 0x4a2821, texture: "emberfall-floor-v1" },
      { color: 0x263b28, texture: "toxic-bloom-floor-v1" },
      { color: 0x24213d, texture: "void-approach-floor-v1" },
      { color: 0x304352, texture: "arctic-relay-floor-v1" },
    ] as const;
    themes.forEach((theme, index) => {
      const x = 108 + index * 185;
      this.add.rectangle(x, 410, 164, 118, theme.color).setStrokeStyle(2, 0x728ba1);
      this.add.sprite(x - 42, 410, theme.texture, index % 6).setScale(1.7).setAlpha(0.65);
      this.add.sprite(x, 410, "telegraph-large-v1", index % 4).setScale(0.62).setAlpha(0.82);
      this.add.sprite(x + 47, 410, "telegraph-small-v1", index % 8).setScale(0.72).setAlpha(0.9);
    });
    this.add.text(480, 508, "Review: ?mode=gallery&batch=j2 • decals never replace code radius, arc, beam, target, or edge clipping", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createScrapShopGallery(): void {
    this.add.text(20, 14, "LAST BASTION — PRODUCTION SCRAP SHOP UI BATCH N2", style("#ffffff", "17px"));
    this.add.text(20, 38, "11 runtime visuals • 128 px offer/HUD contract • 1024×576 empty panel • all language and state code-owned", style("#8fb2c9", "11px"));

    this.add.image(390, 218, "scrap-shop-panel-v1").setDisplaySize(690, 388);
    this.add.text(390, 72, "EMPTY SHOP TERMINAL PANEL", style("#68e4e8", "10px")).setOrigin(0.5);

    this.add.text(825, 72, "HUD FRAMES", style("#ffd36b", "10px")).setOrigin(0.5);
    for (let frame = 0; frame < 4; frame += 1) {
      const x = 790 + (frame % 2) * 80;
      const y = 125 + Math.floor(frame / 2) * 84;
      this.add.sprite(x, y, "scrap-shop-hud-v1", frame).setScale(0.5);
      this.add.text(x, y + 35, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 388, "128 PX OFFERS — repair / uranium / armour / upgrade / weapon / sold-locked", style("#ffb982", "10px")).setOrigin(0.5);
    for (let frame = 0; frame < 6; frame += 1) {
      const x = 150 + frame * 132;
      this.add.sprite(x, 455, "scrap-shop-offer-tiles-v1", frame).setScale(0.56);
      this.add.text(x, 497, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 522, "Review: ?mode=gallery&batch=n2 • Live Shop: ?scenario=scrap-shop&loadout=vertical", style("#8fb2c9", "10px")).setOrigin(0.5);
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

  private createBatchE2Gallery(): void {
    this.add.text(20, 14, "LAST BASTION — SPINEWHEEL PRODUCTION ASSET BATCH E2", style("#ffffff", "17px"));
    this.add.text(20, 38, "24 runtime visuals • retained Steam-quality masters • code-driven reflection geometry", style("#8fb2c9", "11px"));

    this.add.text(20, 68, "BODY — positioning / heading lock / exposed recovery × S N E W", style("#ffb06b", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const x = 78 + (frame % 6) * 160;
      const y = 126 + Math.floor(frame / 6) * 112;
      this.add.sprite(x, y, "spinewheel-v1", frame).setScale(0.78);
      this.drawPivot(x, y);
      this.add.text(x, y + 44, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 278, "CLOSED SHELL — four rotation phases", style("#ffcf88", "11px"));
    for (let frame = 0; frame < 4; frame += 1) {
      const x = 92 + frame * 126;
      this.add.sprite(x, 336, "spinewheel-shell-v1", frame).setScale(0.82);
      this.drawPivot(x, 336);
      this.add.text(x, 380, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(552, 278, "EFFECTS — curl / trail / rebounds / impact / recovery / defeat", style("#ffd08a", "10px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 578 + (frame % 4) * 96;
      const y = 326 + Math.floor(frame / 4) * 86;
      this.add.sprite(x, y, "spinewheel-effects-v1", frame).setScale(1.02);
      this.drawPivot(x, y);
      this.add.text(x, y + 36, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 486, "Shell animation is rotation-neutral; warning path, collision, rebound count, and speed decay remain authoritative code", style("#ffb982", "9px")).setOrigin(0.5);
    this.add.text(480, 518, "Review: ?mode=gallery&batch=e2 • Encounter: ?scenario=spinewheel&loadout=vertical", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchE3Gallery(): void {
    this.add.text(20, 14, "LAST BASTION — TETHER BLOOM PRODUCTION ASSET BATCH E3", style("#ffffff", "17px"));
    this.add.text(20, 38, "24 runtime visuals • retained Steam-quality masters • code-driven tether geometry", style("#8fb2c9", "11px"));

    this.add.text(20, 68, "BODY — idle / acquisition / active channel / exhausted recovery × four animation phases", style("#d696ff", "11px"));
    for (let frame = 0; frame < 16; frame += 1) {
      const x = 62 + (frame % 8) * 118;
      const y = 128 + Math.floor(frame / 8) * 116;
      this.add.sprite(x, y, "tether-bloom-v1", frame).setScale(0.72);
      this.drawPivot(x, y);
      this.add.text(x, y + 42, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 302, "EFFECTS — acquisition / target / latch / travelling accent / evasive sever / damage sever / recovery / defeat", style("#cdea72", "10px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 64 + frame * 118;
      this.add.sprite(x, 376, "tether-bloom-effects-v1", frame).setScale(1.08);
      this.drawPivot(x, 376);
      this.add.text(x, 420, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(480, 478, "The authored accent rides the live line; LOS, target, range, pull, cover, dodge, and damage breaks remain authoritative code", style("#d8b7ff", "9px")).setOrigin(0.5);
    this.add.text(480, 518, "Review: ?mode=gallery&batch=e3 • Encounter: ?scenario=tether-bloom&loadout=vertical", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchF1Gallery(): void {
    this.add.text(20, 14, "LAST BASTION — PATROL BLADE + ACTION UI — BATCH F1", style("#ffffff", "17px"));
    this.add.text(20, 38, "Steam-ready edit masters • deterministic runtime atlases • code-driven timing and geometry", style("#8fb2c9", "11px"));

    this.add.text(20, 72, "PATROL BLADE — folded / ready / sweep / recovery", style("#ffd08a", "11px"));
    for (let frame = 0; frame < 4; frame += 1) {
      const x = 120 + frame * 230;
      this.add.sprite(x, 140, "patrol-blade-v1", frame).setScale(1.25);
      this.drawPivot(x, 140);
      this.add.text(x, 194, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 220, "MELEE EFFECTS — anticipation / active / flesh / armour / cover / ready", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 6; frame += 1) {
      const x = 88 + frame * 156;
      this.add.sprite(x, 280, "patrol-blade-effects-v1", frame).setScale(1.05);
      this.add.text(x, 322, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }

    this.add.text(20, 348, "ACTION MOTIFS — roll / ultimate / blade / uranium kit / empty kit / empty active", style("#b9ef62", "11px"));
    for (let frame = 0; frame < 6; frame += 1) {
      const x = 80 + frame * 128;
      this.add.sprite(x, 410, "action-tiles-v1", frame).setScale(0.9);
      this.add.text(x, 450, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }
    this.add.image(872, 408, "uranium-status-v1").setScale(0.9);
    this.add.text(872, 450, "STATUS", style("#b9ef62", "8px")).setOrigin(0.5);

    this.add.text(480, 490, "Art remains legible under radial cooldown shadow; bindings, seconds, rings, states, and hit tests stay authoritative code", style("#ffcf7a", "9px")).setOrigin(0.5);
    this.add.text(480, 518, "Review: ?mode=gallery&batch=f1 • Lab: ?loadout=patrol&kit=uranium", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createWeaponBatchGallery(
    weaponName: string,
    batchName: string,
    weaponTexture: "bolt-carbine-v1" | "bulwark-rotary-cannon-v1" | "grenade-tube-v1",
    effectTexture: "bolt-carbine-effects-v1" | "bulwark-rotary-effects-v1" | "grenade-tube-effects-v1",
    tileFrame: number,
    labRoute: string,
  ): void {
    this.add.text(20, 14, `LAST BASTION — ${weaponName} — BATCH ${batchName}`, style("#ffffff", "17px"));
    this.add.text(20, 38, "Retained Steam-quality masters • deterministic runtime atlases • code-authoritative combat", style("#8fb2c9", "11px"));
    this.add.text(20, 72, "WEAPON STATES — idle / charge or spin / fire / recover", style("#ffcf7a", "11px"));
    for (let frame = 0; frame < 4; frame += 1) {
      const x = 120 + frame * 230;
      this.add.sprite(x, 142, weaponTexture, frame).setScale(1.18);
      this.drawPivot(x, 142);
      this.add.text(x, 196, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }
    this.add.text(20, 224, "PROJECTILE + EFFECT FAMILY — eight isolated gameplay reads", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 66 + frame * 116;
      this.add.sprite(x, 300, effectTexture, frame).setScale(1.02);
      this.add.text(x, 344, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }
    this.add.text(20, 380, "COOLDOWN / WEAPON MOTIF", style("#b9ef62", "11px"));
    this.add.sprite(110, 438, "weapon-tiles-v1", tileFrame).setScale(0.9);
    this.add.text(200, 432, "Runtime bindings, cooldown shadow, numeric time, hit geometry, trajectory and damage remain code-driven.", style("#b7c9d8", "9px"));
    this.add.text(480, 518, `Review: ?mode=gallery&batch=${batchName.toLowerCase()} • Lab: ${labRoute}`, style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createBatchKGallery(): void {
    this.add.text(20, 14, "LAST BASTION - STATUS OVERLAY PRODUCTION ASSET BATCH K", style("#ffffff", "17px"));
    this.add.text(20, 38, "15 authored frames + one reserved transparent cell / stable 4x4 runtime contract", style("#8fb2c9", "11px"));
    const rows = [
      { name: "BLAZE - asymmetric 90 ms flicker", color: "#ff6b3d", start: 0, count: 4 },
      { name: "OVERLOAD - 72 ms strobe + dark beat", color: "#68e4e8", start: 4, count: 4 },
      { name: "CORRODE - lazy 260 ms bubble drift", color: "#b9ef62", start: 8, count: 4 },
      { name: "FREEZE - near-still 420 ms shimmer", color: "#9ad9ff", start: 12, count: 3 },
    ] as const;

    rows.forEach((row, rowIndex) => {
      const y = 104 + rowIndex * 102;
      this.add.text(30, y - 35, row.name, style(row.color, "11px"));
      for (let index = 0; index < row.count; index += 1) {
        const x = 86 + index * 106;
        this.add.circle(x, y, 34, 0x26303b).setStrokeStyle(1, 0x53677b);
        this.add.sprite(x, y, "status-overlays-v1", row.start + index).setScale(1.25);
        this.add.text(x, y + 38, String(row.start + index), style("#728ba1", "8px")).setOrigin(0.5);
      }
      const previewX = 700;
      this.add.sprite(previewX, y, "scuttler-v1", rowIndex % 8).setScale(1.15);
      const preview = this.add.sprite(previewX, y, "status-overlays-v1", row.start).setScale(1.35);
      this.tweens.addCounter({
        from: 0,
        to: row.count,
        duration: row.count * (rowIndex === 0 ? 90 : rowIndex === 1 ? 72 : rowIndex === 2 ? 260 : 420),
        repeat: -1,
        onUpdate: (tween) => preview.setFrame(row.start + Math.min(row.count - 1, Math.floor(tween.getValue() ?? 0))),
      });
      this.add.sprite(830, y, "siege-crusher-v1", rowIndex % 12).setScale(0.62);
      this.add.sprite(830, y, "status-overlays-v1", row.start + (rowIndex % row.count)).setScale(2.1);
    });

    this.add.text(480, 510, "Left: frame contract / centre: 64 px enemy / right: elite scaling / timing and tint remain simulation-owned", style("#b7c9d8", "9px")).setOrigin(0.5);
    this.add.text(480, 528, "Review: ?mode=gallery&batch=k / live overlays appear whenever typed buildup triggers a status", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createEventHorizonGallery(): void {
    this.add.text(20, 14, "LAST BASTION - EVENT HORIZON UNIQUE ART PREFLIGHT", style("#ffffff", "17px"));
    this.add.text(20, 38, "Held from live gameplay until the pull-field / implosion behavior gate passes", style("#d696ff", "11px"));
    this.add.text(20, 72, "RING WEAPON STATES - ready / charge / fire / recover", style("#ffcf7a", "11px"));
    for (let frame = 0; frame < 4; frame += 1) {
      const x = 120 + frame * 205;
      this.add.sprite(x, 142, "event-horizon-v1", frame).setScale(1.08);
      this.add.text(x, 198, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }
    this.add.text(20, 226, "GRAVITIC PROJECTILE + EFFECT FAMILY - stable eight-frame map", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 60 + (frame % 8) * 116;
      this.add.sprite(x, 300, "event-horizon-effects-v1", frame).setScale(1.05);
      this.add.text(x, 344, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }
    this.add.text(20, 386, "UNIQUE ACTIVE TILE", style("#d696ff", "11px"));
    this.add.sprite(100, 448, "event-horizon-tile-v1").setScale(1.15);
    this.add.text(200, 442, "Black core eclipsing a broken cyan ring. Cooldown ring, seconds, key label, charge, and selection states remain code-rendered.", style("#b7c9d8", "9px"));
    this.add.text(480, 518, "Review: ?mode=gallery&batch=eh - no normal-run binding until behavior approval", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createCorruptedHumanGallery(): void {
    this.add.text(20, 14, "LAST BASTION - CORRUPTED HUMAN OUTBREAK PREFLIGHT", style("#ffffff", "17px"));
    this.add.text(20, 38, "Held post-Web-MVP: body art and knife effects are ready; behavior gates remain simulation-owned", style("#ff9a72", "11px"));
    this.add.text(20, 70, "INFECTED SURVIVOR - gait rows / S N E W", style("#ffcf7a", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 62 + (frame % 4) * 82;
      const y = 122 + Math.floor(frame / 4) * 104;
      this.add.sprite(x, y, "corrupted-survivor-v1", frame).setScale(0.78);
      this.add.text(x, y + 48, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }
    this.add.text(390, 70, "CORRUPTED MARINE - guard / throw wind-up / stagger", style("#ff9a72", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const x = 440 + (frame % 4) * 82;
      const y = 122 + Math.floor(frame / 4) * 82;
      this.add.sprite(x, y, "corrupted-marine-v1", frame).setScale(0.68);
      this.add.text(x, y + 43, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }
    this.add.text(20, 346, "ABOMINATION ELITE - shamble / slam wind-up / recovery-collapse", style("#d696ff", "11px"));
    for (let frame = 0; frame < 12; frame += 1) {
      const x = 72 + (frame % 4) * 116;
      const y = 414 + Math.floor(frame / 4) * 84;
      this.add.sprite(x, y, "abomination-v1", frame).setScale(0.48);
      this.add.text(x, y + 58, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }
    this.add.text(560, 346, "MARINE KNIFE / TELEGRAPH / IMPACT ATLAS", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 620 + (frame % 4) * 78;
      const y = 408 + Math.floor(frame / 4) * 78;
      this.add.sprite(x, y, "corrupted-marine-effects-v1", frame).setScale(1.0);
      this.add.text(x, y + 36, String(frame), style("#728ba1", "8px")).setOrigin(0.5);
    }
    this.add.text(480, 528, "Review: ?mode=gallery&batch=m - no live spawning until survivor, knife throw, and abomination gates pass", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createEmberfallGallery(): void {
    this.add.text(20, 14, "LAST BASTION - EMBERFALL WORLD THEME PREFLIGHT", style("#ffffff", "17px"));
    this.add.text(20, 38, "Collision silhouettes match Batch A; contrast is intentionally below actor and telegraph contrast", style("#ff9a72", "11px"));
    this.add.text(20, 70, "FLOOR TILES - clean / variants / hatch / cracked / ember edge", style("#ffcf7a", "11px"));
    for (let frame = 0; frame < 6; frame += 1) {
      const x = 58 + (frame % 6) * 78;
      this.add.sprite(x, 126, "emberfall-floor-v1", frame).setScale(1.05);
    }
    this.add.text(20, 202, "BOUNDARY CONNECTIONS - straight / corners / junctions / damaged / gate", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 58 + (frame % 8) * 108;
      this.add.sprite(x, 258, "emberfall-boundary-v1", frame).setScale(1.18);
    }
    this.add.text(20, 342, "OBSTACLE RE-DRESS - footprints preserved", style("#d696ff", "11px"));
    for (let frame = 0; frame < 4; frame += 1) {
      const x = 90 + frame * 145;
      this.add.sprite(x, 416, "emberfall-obstacles-v1", frame).setScale(0.62);
    }
    this.add.text(530, 342, "LOW-CONTRAST DECALS - placed under gameplay", style("#ffcf7a", "11px"));
    for (let frame = 0; frame < 6; frame += 1) {
      const x = 580 + (frame % 3) * 104;
      const y = 400 + Math.floor(frame / 3) * 74;
      this.add.sprite(x, y, "emberfall-decals-v1", frame).setScale(1.15);
    }
    this.add.text(480, 528, "Review: ?mode=gallery&batch=h - art preflight only; theme assignment and draw order remain code-owned", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createToxicBloomGallery(): void {
    this.add.text(20, 14, "LAST BASTION - TOXIC BLOOM WORLD THEME PREFLIGHT", style("#ffffff", "17px"));
    this.add.text(20, 38, "Batch H variant: collision contracts match Batch A; restrained lime is reserved for toxic accents", style("#b9ef62", "11px"));
    this.add.text(20, 70, "FLOOR TILES", style("#68e4e8", "11px"));
    for (let frame = 0; frame < 6; frame += 1) {
      const x = 58 + (frame % 6) * 78;
      this.add.sprite(x, 126, "toxic-bloom-floor-v1", frame).setScale(1.05);
    }
    this.add.text(20, 202, "BOUNDARY CONNECTIONS", style("#b9ef62", "11px"));
    for (let frame = 0; frame < 8; frame += 1) {
      const x = 58 + (frame % 8) * 108;
      this.add.sprite(x, 258, "toxic-bloom-boundary-v1", frame).setScale(1.18);
    }
    this.add.text(20, 342, "OBSTACLE RE-DRESS", style("#d696ff", "11px"));
    for (let frame = 0; frame < 4; frame += 1) {
      const x = 90 + frame * 145;
      this.add.sprite(x, 416, "toxic-bloom-obstacles-v1", frame).setScale(0.62);
    }
    this.add.text(530, 342, "LOW-CONTRAST DECALS", style("#b9ef62", "11px"));
    for (let frame = 0; frame < 6; frame += 1) {
      const x = 580 + (frame % 3) * 104;
      const y = 400 + Math.floor(frame / 3) * 74;
      this.add.sprite(x, y, "toxic-bloom-decals-v1", frame).setScale(1.15);
    }
    this.add.text(480, 528, "Review: ?mode=gallery&batch=tb - held until grayscale/telegraph contrast approval", style("#8fb2c9", "10px")).setOrigin(0.5);
  }

  private createWorldVariantGallery(title: string, floor: string, boundary: string, obstacles: string, decals: string, accent: string): void {
    this.add.text(20, 14, `LAST BASTION - ${title} WORLD THEME PREFLIGHT`, style("#ffffff", "17px"));
    this.add.text(20, 38, "Batch H variant: Batch A collision contracts preserved; held for grayscale and telegraph review", style(accent, "11px"));
    this.add.text(20, 70, "FLOOR TILES", style(accent, "11px"));
    for (let frame = 0; frame < 6; frame += 1) this.add.sprite(58 + frame * 78, 126, floor, frame).setScale(1.05);
    this.add.text(20, 202, "BOUNDARY CONNECTIONS", style(accent, "11px"));
    for (let frame = 0; frame < 8; frame += 1) this.add.sprite(58 + frame * 108, 258, boundary, frame).setScale(1.18);
    this.add.text(20, 342, "OBSTACLE RE-DRESS", style(accent, "11px"));
    for (let frame = 0; frame < 4; frame += 1) this.add.sprite(90 + frame * 145, 416, obstacles, frame).setScale(0.62);
    this.add.text(530, 342, "LOW-CONTRAST DECALS", style(accent, "11px"));
    for (let frame = 0; frame < 6; frame += 1) this.add.sprite(580 + (frame % 3) * 104, 400 + Math.floor(frame / 3) * 74, decals, frame).setScale(1.15);
    this.add.text(480, 528, "Review: ?mode=gallery&batch=va - held until grayscale/telegraph contrast approval", style("#8fb2c9", "10px")).setOrigin(0.5);
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
