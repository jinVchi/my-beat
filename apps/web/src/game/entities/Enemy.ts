import Phaser from "phaser";
import {
  ENEMY_BODY_WIDTH,
  ENEMY_BODY_HEIGHT,
  ENEMY_WARNING_DURATION,
  ENEMY_WARNING_FLASHES,
  ENEMY_ATTACK_HITBOX_WIDTH,
  ENEMY_ATTACK_RANGE_Y,
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
  private attackFx?: Phaser.GameObjects.Rectangle;
  private wasAttacking = false;
  private flashingHit = false;
  private targetX: number;
  private targetY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, maxHealth = 100) {
    super(scene, x, y);

    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.targetX = x;
    this.targetY = y;

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

  updateFromServer(
    health: number,
    isDead: boolean,
    x: number,
    y: number,
    isWarning: boolean,
    isAttacking: boolean,
    warningTimer: number,
  ): void {
    if (this.isDead) return;

    this.targetX = x;
    this.targetY = y;

    const previousHealth = this.health;
    this.health = health;

    if (health < previousHealth) {
      this.flashHit();
    }

    this.updateHealthBar();
    this.updateBodyColor(isWarning, isAttacking, warningTimer);

    // Trigger attack visual effect on first attacking frame
    if (isAttacking && !this.wasAttacking) {
      this.spawnAttackFx();
    }
    this.wasAttacking = isAttacking;

    if (isDead && !this.isDead) {
      this.die();
    }
  }

  smoothUpdate(deltaMs: number): void {
    if (this.isDead) return;

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

  private updateBodyColor(
    isWarning: boolean,
    isAttacking: boolean,
    warningTimer: number,
  ) {
    if (this.flashingHit) return; // don't clobber hit flash

    if (isAttacking) {
      this.bodyRect.setFillStyle(0xff8844);
      return;
    }

    if (isWarning) {
      // Blink yellow ENEMY_WARNING_FLASHES times over the warning duration
      const elapsed = ENEMY_WARNING_DURATION - warningTimer;
      const phase = Math.floor(
        (elapsed / ENEMY_WARNING_DURATION) * (ENEMY_WARNING_FLASHES * 2),
      );
      const yellow = phase % 2 === 0;
      this.bodyRect.setFillStyle(yellow ? 0xffff00 : 0xcc3333);
      return;
    }

    this.bodyRect.setFillStyle(0xcc3333);
  }

  private spawnAttackFx() {
    const fx = this.scene.add.rectangle(
      this.x,
      this.y,
      ENEMY_ATTACK_HITBOX_WIDTH,
      ENEMY_ATTACK_RANGE_Y * 2,
      0xffaa00,
      0.5,
    );
    fx.setStrokeStyle(2, 0xff3300);
    fx.setDepth(this.y + 1);
    this.scene.tweens.add({
      targets: fx,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 250,
      onComplete: () => fx.destroy(),
    });
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
    this.flashingHit = true;
    this.bodyRect.setFillStyle(0xffffff);
    this.scene.time.delayedCall(100, () => {
      this.flashingHit = false;
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
