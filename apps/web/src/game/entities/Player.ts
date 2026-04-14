import Phaser from "phaser";
import {
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
  PLAYER_MAX_HEALTH,
} from "@my-beat/shared-types/game-config";

const BODY_WIDTH = PLAYER_BODY_WIDTH;
const BODY_HEIGHT = PLAYER_BODY_HEIGHT;

export default class Player extends Phaser.GameObjects.Container {
  private bodyRect: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private facingRight = true;
  private directionIndicator: Phaser.GameObjects.Triangle;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private health = PLAYER_MAX_HEALTH;
  private maxHealth = PLAYER_MAX_HEALTH;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.bodyRect = scene.add.rectangle(
      0,
      0,
      BODY_WIDTH,
      BODY_HEIGHT,
      0x3399ff,
    );
    this.bodyRect.setStrokeStyle(2, 0xffffff);
    this.add(this.bodyRect);

    this.directionIndicator = scene.add.triangle(
      BODY_WIDTH / 2 + 6,
      0,
      0,
      -6,
      0,
      6,
      10,
      0,
      0xffff00,
    );
    this.add(this.directionIndicator);

    this.label = scene.add
      .text(0, -BODY_HEIGHT / 2 - 14, "PLAYER", {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5, 0.5);
    this.add(this.label);

    const barWidth = 48;
    const barHeight = 6;
    const barY = -BODY_HEIGHT / 2 - 26;

    this.healthBarBg = scene.add.rectangle(
      0,
      barY,
      barWidth,
      barHeight,
      0x333333,
    );
    this.healthBarBg.setStrokeStyle(1, 0x000000);
    this.add(this.healthBarBg);

    this.healthBarFill = scene.add.rectangle(
      0,
      barY,
      barWidth - 2,
      barHeight - 2,
      0x00cc00,
    );
    this.add(this.healthBarFill);

    scene.add.existing(this);
    this.setSize(BODY_WIDTH, BODY_HEIGHT);
  }

  updateFromServer(
    x: number,
    y: number,
    facingRight: boolean,
    isAttacking: boolean,
    health: number,
  ): void {
    if (!this.active) return;
    this.x = x;
    this.y = y;
    this.facingRight = facingRight;

    // Update direction indicator
    if (this.facingRight) {
      this.directionIndicator.setPosition(BODY_WIDTH / 2 + 6, 0);
      this.directionIndicator.setTo(0, -6, 0, 6, 10, 0);
    } else {
      this.directionIndicator.setPosition(-BODY_WIDTH / 2 - 6, 0);
      this.directionIndicator.setTo(10, -6, 10, 6, 0, 0);
    }

    // Visual attack feedback
    this.bodyRect.setFillStyle(isAttacking ? 0x66ccff : 0x3399ff);

    // Health
    if (health < this.health) {
      this.flashHit();
    }
    this.health = health;
    this.updateHealthBar();
  }

  private updateHealthBar() {
    const ratio = Math.max(0, this.health / this.maxHealth);
    const maxWidth = 46;
    this.healthBarFill.width = maxWidth * ratio;

    if (ratio > 0.5) {
      this.healthBarFill.setFillStyle(0x00cc00);
    } else if (ratio > 0.25) {
      this.healthBarFill.setFillStyle(0xcccc00);
    } else {
      this.healthBarFill.setFillStyle(0xcc0000);
    }
  }

  private flashHit() {
    const baseColor = 0x3399ff;
    this.bodyRect.setFillStyle(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.bodyRect.setFillStyle(baseColor);
      }
    });
  }
}
