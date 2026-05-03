import Phaser from "phaser";
import {
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
  PLAYER_MAX_HEALTH,
} from "@my-beat/shared-types/game-config";

const BODY_WIDTH = PLAYER_BODY_WIDTH;
const BODY_HEIGHT = PLAYER_BODY_HEIGHT;

const COLOR_IDLE = 0x3366cc;
const COLOR_ATTACK = 0x66aaff;
const COLOR_HIT = 0xffffff;
const COLOR_DEAD = 0x555555;

export default class Player extends Phaser.GameObjects.Container {
  private bodyRect: Phaser.GameObjects.Rectangle;
  private directionIndicator: Phaser.GameObjects.Triangle;
  private label: Phaser.GameObjects.Text;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private facingRight = true;
  private health = PLAYER_MAX_HEALTH;
  private maxHealth = PLAYER_MAX_HEALTH;
  private isHitFlashing = false;
  private targetX: number;
  private targetY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.targetX = x;
    this.targetY = y;

    this.bodyRect = scene.add.rectangle(0, 0, BODY_WIDTH, BODY_HEIGHT, COLOR_IDLE);
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

    this.healthBarBg = scene.add.rectangle(0, barY, barWidth, barHeight, 0x333333);
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

    this.targetX = x;
    this.targetY = y;
    this.facingRight = facingRight;

    if (facingRight) {
      this.directionIndicator.setPosition(BODY_WIDTH / 2 + 6, 0);
      this.directionIndicator.setTo(0, -6, 0, 6, 10, 0);
    } else {
      this.directionIndicator.setPosition(-BODY_WIDTH / 2 - 6, 0);
      this.directionIndicator.setTo(10, -6, 10, 6, 0, 0);
    }

    if (health < this.health) {
      this.flashHit();
    }
    this.health = health;
    this.updateHealthBar();

    if (!this.isHitFlashing) {
      if (this.health <= 0) {
        this.bodyRect.setFillStyle(COLOR_DEAD);
      } else if (isAttacking) {
        this.bodyRect.setFillStyle(COLOR_ATTACK);
      } else {
        this.bodyRect.setFillStyle(COLOR_IDLE);
      }
    }
  }

  smoothUpdate(deltaMs: number): void {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq > 240 * 240) {
      this.setPosition(this.targetX, this.targetY);
      return;
    }

    const alpha = 1 - Math.exp(-deltaMs / 30);
    this.x += dx * alpha;
    this.y += dy * alpha;

    if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
      this.setPosition(this.targetX, this.targetY);
    }
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
    this.isHitFlashing = true;
    this.bodyRect.setFillStyle(COLOR_HIT);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.isHitFlashing = false;
      }
    });
  }
}
