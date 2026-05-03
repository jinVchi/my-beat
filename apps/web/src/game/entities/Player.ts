import Phaser from "phaser";
import {
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
  PLAYER_MAX_HEALTH,
  ATTACK_DURATION,
  ATTACK_RANGE_X,
  ATTACK_RANGE_Y,
  ATTACK_HITBOX_WIDTH,
  HEAVY_ATTACK_DURATION,
  HEAVY_ATTACK_RANGE_X,
  HEAVY_ATTACK_RANGE_Y,
  HEAVY_ATTACK_HITBOX_WIDTH,
  JUMP_DURATION,
  JUMP_HEIGHT,
} from "@my-beat/shared-types/game-config";
import { AttackType } from "@my-beat/shared-types/messages";
import type { AttackType as AttackTypeValue } from "@my-beat/shared-types/messages";

const BODY_WIDTH = PLAYER_BODY_WIDTH;
const BODY_HEIGHT = PLAYER_BODY_HEIGHT;

const COLOR_IDLE = 0x3366cc;
const COLOR_ATTACK = 0x66aaff;
const COLOR_HIT = 0xffffff;
const COLOR_DEAD = 0x555555;

export default class Player extends Phaser.GameObjects.Container {
  private visualLayer: Phaser.GameObjects.Container;
  private attackHitbox: Phaser.GameObjects.Rectangle;
  private bodyRect: Phaser.GameObjects.Rectangle;
  private directionIndicator: Phaser.GameObjects.Triangle;
  private label: Phaser.GameObjects.Text;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private facingRight = true;
  private health = PLAYER_MAX_HEALTH;
  private maxHealth = PLAYER_MAX_HEALTH;
  private isHitFlashing = false;
  private localAttackTimer = 0;
  private localAttackType: AttackTypeValue | null = null;
  private attackPreviewUntil = 0;
  private jumpOffset = 0;
  private jumpPreviewUntil = 0;
  private targetX: number;
  private targetY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.targetX = x;
    this.targetY = y;

    this.visualLayer = scene.add.container(0, 0);
    this.add(this.visualLayer);

    this.bodyRect = scene.add.rectangle(0, 0, BODY_WIDTH, BODY_HEIGHT, COLOR_IDLE);
    this.bodyRect.setStrokeStyle(2, 0xffffff);
    this.visualLayer.add(this.bodyRect);

    this.attackHitbox = scene.add.rectangle(0, 0, 1, 1, 0xffff00, 0.5);
    this.attackHitbox.setStrokeStyle(3, 0xffee00, 1);
    this.attackHitbox.setVisible(false);
    this.visualLayer.add(this.attackHitbox);

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
    this.visualLayer.add(this.directionIndicator);

    this.label = scene.add
      .text(0, -BODY_HEIGHT / 2 - 14, "PLAYER", {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5, 0.5);
    this.visualLayer.add(this.label);

    const barWidth = 48;
    const barHeight = 6;
    const barY = -BODY_HEIGHT / 2 - 26;

    this.healthBarBg = scene.add.rectangle(0, barY, barWidth, barHeight, 0x333333);
    this.healthBarBg.setStrokeStyle(1, 0x000000);
    this.visualLayer.add(this.healthBarBg);

    this.healthBarFill = scene.add.rectangle(
      0,
      barY,
      barWidth - 2,
      barHeight - 2,
      0x00cc00,
    );
    this.visualLayer.add(this.healthBarFill);

    scene.add.existing(this);
    this.setSize(BODY_WIDTH, BODY_HEIGHT);
  }

  updateFromServer(
    x: number,
    y: number,
    facingRight: boolean,
    isAttacking: boolean,
    attackType: AttackTypeValue | null,
    attackTimer: number,
    jumpOffset: number,
    health: number,
  ): void {
    if (!this.active) return;

    this.targetX = x;
    this.targetY = y;
    this.facingRight = facingRight;
    if (Number.isFinite(jumpOffset) || this.scene.time.now >= this.jumpPreviewUntil) {
      this.jumpOffset = Number.isFinite(jumpOffset) ? jumpOffset : 0;
      this.visualLayer.setY(-this.jumpOffset);
    }

    if (facingRight) {
      this.directionIndicator.setPosition(BODY_WIDTH / 2 + 6, 0);
      this.directionIndicator.setTo(0, -6, 0, 6, 10, 0);
    } else {
      this.directionIndicator.setPosition(-BODY_WIDTH / 2 - 6, 0);
      this.directionIndicator.setTo(10, -6, 10, 6, 0, 0);
    }

    if (isAttacking || this.scene.time.now >= this.attackPreviewUntil) {
      this.localAttackTimer = isAttacking
        ? this.getServerAttackTimer(attackTimer)
        : 0;
      this.localAttackType = isAttacking
        ? (attackType ?? AttackType.LIGHT)
        : null;
      this.updateAttackHitbox();
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
    if (this.localAttackTimer > 0) {
      this.localAttackTimer = Math.max(0, this.localAttackTimer - deltaMs);
      this.updateAttackHitbox();
    }

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

  showAttackPreview(attackType: AttackTypeValue): void {
    this.localAttackType = attackType;
    this.localAttackTimer = this.getAttackDuration(attackType);
    this.attackPreviewUntil = this.scene.time.now + this.localAttackTimer;
    this.updateAttackHitbox();

    if (!this.isHitFlashing && this.health > 0) {
      this.bodyRect.setFillStyle(COLOR_ATTACK);
    }
  }

  showJumpPreview(): void {
    if (this.jumpOffset > 0 || this.scene.time.now < this.jumpPreviewUntil) return;

    this.jumpPreviewUntil = this.scene.time.now + JUMP_DURATION;
    this.scene.tweens.killTweensOf(this.visualLayer);
    this.scene.tweens.add({
      targets: this.visualLayer,
      y: -JUMP_HEIGHT,
      duration: JUMP_DURATION / 2,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (this.active) {
          this.visualLayer.setY(0);
        }
      },
    });
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

  private updateAttackHitbox() {
    if (this.localAttackTimer <= 0 || !this.localAttackType) {
      this.attackHitbox.setVisible(false);
      return;
    }

    const isHeavy = this.localAttackType === AttackType.HEAVY;
    const rangeX = isHeavy ? HEAVY_ATTACK_RANGE_X : ATTACK_RANGE_X;
    const rangeY = isHeavy ? HEAVY_ATTACK_RANGE_Y : ATTACK_RANGE_Y;
    const width = isHeavy ? HEAVY_ATTACK_HITBOX_WIDTH : ATTACK_HITBOX_WIDTH;
    const x = this.facingRight ? rangeX : -rangeX;

    this.attackHitbox
      .setPosition(x, 0)
      .setSize(width, rangeY * 2)
      .setFillStyle(0xffff00, isHeavy ? 0.62 : 0.52)
      .setVisible(true);
  }

  private getServerAttackTimer(attackTimer: number): number {
    if (Number.isFinite(attackTimer) && attackTimer > 0) {
      return attackTimer;
    }

    return ATTACK_DURATION;
  }

  private getAttackDuration(attackType: AttackTypeValue): number {
    return attackType === AttackType.HEAVY
      ? HEAVY_ATTACK_DURATION
      : ATTACK_DURATION;
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
