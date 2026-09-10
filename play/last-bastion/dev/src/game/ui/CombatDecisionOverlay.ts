import Phaser from "phaser";
import type { PendingDecision } from "../combat/CombatSimulation";
import type { PlayerIntent } from "../input/PlayerIntent";
import { WEAPON_CATALOG } from "../content/weaponCatalog";
import { uiTextResolution } from "../rendering/DisplayScaling";
import { shopWeaponTilePresentation, weaponTilePresentation } from "./WeaponTileFrames";
import { upgradeTilePresentation } from "./UpgradeTilePresentation";

export interface DecisionMenuKeys {
  readonly up: Phaser.Input.Keyboard.Key;
  readonly down: Phaser.Input.Keyboard.Key;
  readonly w: Phaser.Input.Keyboard.Key;
  readonly s: Phaser.Input.Keyboard.Key;
  readonly confirm: Phaser.Input.Keyboard.Key;
  readonly one: Phaser.Input.Keyboard.Key;
  readonly two: Phaser.Input.Keyboard.Key;
  readonly three: Phaser.Input.Keyboard.Key;
  readonly four: Phaser.Input.Keyboard.Key;
  readonly five: Phaser.Input.Keyboard.Key;
  readonly six: Phaser.Input.Keyboard.Key;
  readonly seven: Phaser.Input.Keyboard.Key;
  readonly eight: Phaser.Input.Keyboard.Key;
  readonly nine: Phaser.Input.Keyboard.Key;
}

interface CombatDecisionOverlayOptions {
  readonly keys: DecisionMenuKeys;
  readonly useMarineArt: boolean;
  readonly chooseOption: (choiceId: string) => boolean;
  readonly onConfirmed: () => void;
  readonly onDecisionChanged: () => void;
}

/** Owns decision presentation and keyboard/gamepad/pointer selection state. */
export class CombatDecisionOverlay {
  private overlay: Phaser.GameObjects.Container | null = null;
  private buttons: { rect: Phaser.GameObjects.Rectangle; choiceId: string; enabled: boolean }[] = [];
  private selectionIndex = 0;
  private menuStickReady = true;
  private visibleDecisionKey = "";
  private activeDecisionKind: PendingDecision["kind"] | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: CombatDecisionOverlayOptions,
  ) {}

  handleNavigation(intent: PlayerIntent): void {
    if (this.buttons.length === 0) {
      return;
    }

    let delta = 0;
    if (Phaser.Input.Keyboard.JustDown(this.options.keys.up) || Phaser.Input.Keyboard.JustDown(this.options.keys.w)) {
      delta -= 1;
    }
    if (Phaser.Input.Keyboard.JustDown(this.options.keys.down) || Phaser.Input.Keyboard.JustDown(this.options.keys.s)) {
      delta += 1;
    }
    // Gamepad stick: one step per push, re-armed once the stick recentres.
    if (Math.abs(intent.move.y) < 0.35) {
      this.menuStickReady = true;
    } else if (this.menuStickReady && Math.abs(intent.move.y) > 0.6) {
      delta += intent.move.y > 0 ? 1 : -1;
      this.menuStickReady = false;
    }
    if (delta !== 0) {
      const count = this.buttons.length;
      for (let step = 0; step < count; step += 1) {
        this.selectionIndex = (this.selectionIndex + delta + count) % count;
        if (this.buttons[this.selectionIndex]?.enabled) break;
      }
      this.updateDecisionSelectionHighlight();
    }

    const digits = [
      this.options.keys.one, this.options.keys.two, this.options.keys.three,
      this.options.keys.four, this.options.keys.five, this.options.keys.six,
      this.options.keys.seven, this.options.keys.eight, this.options.keys.nine,
    ];
    for (let index = 0; index < this.buttons.length; index += 1) {
      if (digits[index] && Phaser.Input.Keyboard.JustDown(digits[index]!)) {
        this.selectionIndex = index;
        this.confirmDecisionSelection();
        return;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.options.keys.confirm) || intent.evasiveMovePressed) {
      this.confirmDecisionSelection();
    }
  }

  private confirmDecisionSelection(): void {
    const selected = this.buttons[this.selectionIndex];
    if (!selected?.enabled) {
      return;
    }
    if (this.options.chooseOption(selected.choiceId)) {
      this.options.onConfirmed();
    }
  }

  private updateDecisionSelectionHighlight(): void {
    this.buttons.forEach(({ rect, enabled }, index) => {
      if (!enabled) {
        rect.setFillStyle(0x141b24).setStrokeStyle(2, 0x394756).setAlpha(0.72);
        return;
      }
      rect.setAlpha(1);
      if (index === this.selectionIndex) {
        rect.setFillStyle(0x294865).setStrokeStyle(3, 0x68e4e8);
      } else {
        rect.setFillStyle(0x1b2d42).setStrokeStyle(2, 0x5d7892);
      }
    });
    this.publishAudit();
  }

  /**
   * The overlay deliberately does NOT use scrollFactor(0): Phaser hit-tests
   * interactive objects in world space, so a screen-fixed container drifts
   * away from its own hover/click zones once the camera scrolls. Instead the
   * container follows the camera's world-view centre every frame, keeping
   * the drawn panel and its hit areas identical.
   */
  private positionDecisionOverlay(): void {
    if (!this.overlay) {
      return;
    }
    const camera = this.scene.cameras.main;
    this.overlay.setPosition(
      camera.worldView.centerX,
      camera.worldView.centerY,
    );
  }

  sync(decision: PendingDecision | null): void {
    const nextKey = decision
      ? `${decision.kind}|${decision.title}|${decision.options.map((option) => `${option.id}:${option.affordable ?? true}`).join("|")}`
      : "";
    if (nextKey === this.visibleDecisionKey) {
      this.positionDecisionOverlay();
      return;
    }

    this.overlay?.destroy(true);
    this.overlay = null;
    this.buttons = [];
    this.selectionIndex = 0;
    this.options.onDecisionChanged();
    this.visibleDecisionKey = nextKey;
    this.activeDecisionKind = decision?.kind ?? null;

    if (!decision) {
      this.publishAudit();
      return;
    }

    const isShop = decision.kind === "scrap-shop";
    const isPlacement = decision.kind === "weapon-placement";
    // Level-up stat cards read as a 2x2 grid of cards rather than a list of
    // rows — closest existing shape is the shop's two-column offer layout.
    const isStatCards = decision.kind === "level-stat";
    const statCardRows = isStatCards ? Math.ceil(decision.options.length / 2) : 0;
    const shopColumns = isShop && decision.options.length > 7 ? 2 : 1;
    const shopRows = isShop ? Math.ceil(decision.options.length / shopColumns) : 0;
    const panelWidth = isPlacement ? 860 : isStatCards ? 820 : shopColumns === 2 ? 980 : 760;
    // The plain list grew a fourth row when level-ups started mixing in a stat
    // card, so its height follows the option count instead of being pinned.
    const panelHeight = isShop
      ? Math.max(520, 190 + shopRows * 70)
      : isPlacement ? 520
        : isStatCards ? Math.max(330, 150 + statCardRows * 132)
          : 330 + Math.max(0, decision.options.length - 3) * 86;
    const children: Phaser.GameObjects.GameObject[] = [];
    if (isShop && this.options.useMarineArt) {
      children.push(this.scene.add.image(0, 0, "scrap-shop-panel-v1").setDisplaySize(panelWidth, panelHeight));
    } else if (isPlacement && this.options.useMarineArt) {
      children.push(this.scene.add.image(0, 0, "batch-i-placement-modal-v1").setDisplaySize(panelWidth, panelHeight));
    } else {
      children.push(this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x0b121c, 0.985).setStrokeStyle(4, isShop ? 0xdca652 : 0x68e4e8));
      children.push(this.scene.add.rectangle(0, 0, panelWidth - 18, panelHeight - 18, 0x172536, 0.72).setStrokeStyle(1, 0x4d6a83));
    }
    const titleY = isPlacement ? -220 : -panelHeight / 2 + 40;
    if (isShop && this.options.useMarineArt && shopColumns === 1) {
      if (!this.scene.anims.exists("quartermaster-idle-v1")) {
        this.scene.anims.create({
          key: "quartermaster-idle-v1",
          frames: this.scene.anims.generateFrameNumbers("quartermaster-v1", { start: 0, end: 3 }),
          frameRate: 2,
          repeat: -1,
        });
      }
      const keeper = this.scene.add.sprite(270, panelHeight / 2 - 18, "quartermaster-v1", 0)
        .setDisplaySize(128, 256)
        .setOrigin(0.5, 1)
        .play("quartermaster-idle-v1");
      children.push(keeper);
    }
    const title = this.scene.add.text(0, titleY, decision.title, {
      color: "#ffffff",
      fontFamily: "Consolas, Courier New, monospace",
      fontSize: "22px",
      fontStyle: "bold",
      stroke: "#081018",
      strokeThickness: 4,
    }).setOrigin(0.5).setResolution(uiTextResolution());
    children.push(title);
    if (this.options.useMarineArt) {
      if (isShop) {
        children.push(this.scene.add.image(-325, titleY, "scrap-shop-hud-v1", 0).setDisplaySize(54, 54));
      } else if (!isPlacement) {
        const decisionFrame = decision.kind === "weapon-chest" ? 1 : decision.kind === "supply-depot" ? 4 : 12;
        children.push(this.scene.add.image(-325, titleY, "batch-c-rewards-v1", decisionFrame).setScale(0.62));
      }
    }

    if (isPlacement && decision.weaponId) {
      const stats = WEAPON_CATALOG[decision.weaponId];
      if (this.options.useMarineArt) children.push(this.scene.add.image(-335, -20, "batch-i-weapon-stat-card-v1").setDisplaySize(206, 270));
      const tile = weaponTilePresentation(decision.weaponId);
      children.push(this.scene.add.image(-335, -90, tile.texture, tile.frame).setDisplaySize(112, 112));
      children.push(this.scene.add.text(-335, 8, `${stats.weaponClass.toUpperCase()} • TIER I\nDMG ${stats.projectileDamage}   CADENCE ${stats.fireIntervalSeconds.toFixed(2)}s`, {
        color: "#dce8f2", fontFamily: "Consolas, Courier New, monospace", fontSize: "11px", align: "center", lineSpacing: 5,
      }).setOrigin(0.5).setResolution(uiTextResolution()));
    }

    decision.options.forEach((choice, index) => {
      const shopColumn = shopColumns === 2 ? index % 2 : 0;
      const shopRow = shopColumns === 2 ? Math.floor(index / 2) : index;
      const x = isPlacement ? -70 + (index % 2) * 330
        : isStatCards ? -190 + (index % 2) * 380
          : isShop && shopColumns === 2 ? -238 + shopColumn * 476 : isShop ? -78 : 0;
      const y = isPlacement ? -125 + Math.floor(index / 2) * 98
        : isStatCards ? titleY + 96 + Math.floor(index / 2) * 132
          : isShop ? titleY + 78 + shopRow * 70 : titleY + 65 + index * 86;
      const enabled = choice.affordable !== false;
      const upgradeTile = this.options.useMarineArt ? upgradeTilePresentation(choice.id) : null;
      const shopWeaponTile = isShop && this.options.useMarineArt ? shopWeaponTilePresentation(choice.id) : null;
      const shopButtonWidth = shopColumns === 2 ? 444 : 500;
      const button = this.scene.add.rectangle(
        x, y,
        isPlacement ? 300 : isStatCards ? 344 : isShop ? shopButtonWidth : 670,
        isPlacement ? 78 : isStatCards ? 116 : isShop ? 62 : 66,
        0x1b2d42, 0.98,
      ).setStrokeStyle(2, isStatCards ? 0x68e4e8 : 0x5d7892).setInteractive({ useHandCursor: enabled });
      const price = choice.cost && choice.cost > 0 ? ` — ${choice.cost} SCRAP${enabled ? "" : " (SHORT)"}` : "";
      children.push(button);
      if (isShop && this.options.useMarineArt) {
        children.push(this.scene.add.image(
          x - shopButtonWidth / 2 + 34,
          y,
          shopWeaponTile?.texture ?? upgradeTile?.texture ?? "scrap-shop-offer-tiles-v1",
          shopWeaponTile?.frame ?? upgradeTile?.frame ?? scrapShopOfferFrame(choice.id),
        )
          .setDisplaySize(48, 48).setAlpha(enabled ? 1 : 0.42));
      }
      if (isPlacement && this.options.useMarineArt) {
        children.push(this.scene.add.image(x - 116, y, "batch-i-slot-tier-ui-v1", placementOptionFrame(choice.id, choice.name))
          .setDisplaySize(58, 58).setAlpha(enabled ? 1 : 0.42));
      }
      if (!isShop && !isPlacement && !isStatCards && upgradeTile) {
        children.push(this.scene.add.image(-292, y, upgradeTile.texture, upgradeTile.frame)
          .setDisplaySize(56, 56).setAlpha(enabled ? 1 : 0.42));
      }
      const quickKey = index < 9 ? `${index + 1}. ` : "";
      // A stat card leads with the grant, not the flavour name — the number is
      // the decision, so it gets the weight and the card is centred around it.
      const label = isStatCards
        ? this.scene.add.text(x, y, `${quickKey}${choice.name}\n\n${choice.description.toUpperCase()}`, {
          color: "#edf4ff",
          fontFamily: "Consolas, Courier New, monospace",
          fontSize: "15px",
          align: "center",
          wordWrap: { width: 312 },
          lineSpacing: 4,
        }).setOrigin(0.5).setResolution(uiTextResolution())
        : this.scene.add.text(isPlacement ? x - 78 : isShop ? x - shopButtonWidth / 2 + 76 : upgradeTile ? -250 : -310, y - (isPlacement ? 26 : isShop ? 15 : 18), `${quickKey}${choice.name}${price}\n${choice.description}`, {
          color: enabled ? "#edf4ff" : "#758493",
          fontFamily: "Consolas, Courier New, monospace",
          fontSize: isPlacement ? "13px" : isShop ? "13px" : "15px",
          wordWrap: isPlacement ? { width: 202 } : isShop ? { width: shopButtonWidth - 92 } : upgradeTile ? { width: 520 } : undefined,
          lineSpacing: isShop ? 2 : 5,
        }).setResolution(uiTextResolution());
      button.on("pointerover", () => {
        this.selectionIndex = index;
        this.updateDecisionSelectionHighlight();
      });
      button.on("pointerdown", () => {
        this.selectionIndex = index;
        this.confirmDecisionSelection();
      });
      this.buttons.push({ rect: button, choiceId: choice.id, enabled });
      children.push(label);
    });

    const quickPickCount = Math.min(9, decision.options.length);
    const hint = this.scene.add.text(0, isShop ? titleY + 38 : isPlacement ? 225 : 138, `↑↓ SELECT   •   ENTER CONFIRM   •   1-${quickPickCount} QUICK PICK`, {
      color: "#9fb3c8",
      fontFamily: "Consolas, Courier New, monospace",
      fontSize: "11px",
    }).setOrigin(0.5).setResolution(uiTextResolution());
    children.push(hint);

    this.overlay = this.scene.add.container(0, 0, children).setDepth(2200);
    this.updateDecisionSelectionHighlight();
    this.positionDecisionOverlay();
  }


  reset(): void {
    this.visibleDecisionKey = "";
    this.overlay?.destroy(true);
    this.overlay = null;
    this.buttons = [];
    this.selectionIndex = 0;
    this.menuStickReady = true;
    this.activeDecisionKind = null;
    this.publishAudit();
  }

  destroy(): void {
    this.reset();
  }

  private publishAudit(): void {
    (window as unknown as { __combatDecisionOverlay?: object }).__combatDecisionOverlay = {
      visible: this.overlay !== null,
      kind: this.activeDecisionKind,
      selectedIndex: this.selectionIndex,
      optionIds: this.buttons.map((button) => button.choiceId),
    };
  }
}

function scrapShopOfferFrame(optionId: string): number {
  if (optionId === "shop-repair") return 0;
  if (optionId === "shop-uranium-kit") return 1;
  if (optionId === "shop-armour-retrofit") return 2;
  if (optionId.startsWith("shop-upgrade:")) return 3;
  if (optionId.startsWith("shop-weapon:")) return 4;
  if (optionId.startsWith("shop-item:")) return 5;
  return 5;
}

function placementOptionFrame(optionId: string, name: string): number {
  if (optionId.startsWith("place:inventory:")) return 5;
  if (optionId.startsWith("place:merge:")) return 12;
  if (optionId === "place:discard") return 9;
  if (name.includes("LIGHT")) return 0;
  if (name.includes("MEDIUM")) return 1;
  if (name.includes("HEAVY")) return 2;
  if (name.includes("UNIQUE")) return 3;
  if (name.includes("ALL")) return 4;
  return 15;
}
