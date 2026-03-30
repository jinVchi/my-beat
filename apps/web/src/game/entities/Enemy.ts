import Phaser from "phaser";
import {
  ENEMY_BODY_WIDTH,
  ENEMY_BODY_HEIGHT,
} from "@my-beat/shared-types/game-config";

const BODY_WIDTH = ENEMY_BODY_WIDTH;
const BODY_HEIGHT = ENEMY_BODY_HEIGHT;

export default class Enemy extends Phaser.GameObjects.Container {
  private bodyRect: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;

  health: number;
  maxHealth: number;
  private isDead = false;

  constructor(scene: Phaser.Scene, x: number, y: number, maxHealth = 100) {
    super(scene, x, y);

    this.maxHealth = maxHealth;
    this.health = maxHealth;

    this.bodyRect = scene.add.rectangle(
      0,
      0,
      BODY_WIDTH,
      BODY_HEIGHT,
      0xcc3333,
    );
    this.bodyRect.setStrokeStyle(2, 0xffffff);
    this.add(this.bodyRect);

    this.label = scene.add
      .text(0, -BODY_HEIGHT / 2 - 14, "ENEMY", {
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

  updateFromServer(health: number, isDead: boolean): void {
    if (this.isDead) return;

    const previousHealth = this.health;
    this.health = health;

    if (health < previousHealth) {
      this.flashHit();
    }

    this.updateHealthBar();

    if (isDead && !this.isDead) {
      this.die();
    }
  }

  private updateHealthBar() {
    const ratio = this.health / this.maxHealth;
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
    this.bodyRect.setFillStyle(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (!this.isDead) {
        this.bodyRect.setFillStyle(0xcc3333);
      }
    });
  }

  private die() {
    this.isDead = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
