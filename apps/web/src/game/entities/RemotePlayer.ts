import Phaser from "phaser";
import {
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
  ATTACK_DURATION,
  ATTACK_RANGE_X,
  ATTACK_RANGE_Y,
  ATTACK_HITBOX_WIDTH,
  HEAVY_ATTACK_RANGE_X,
  HEAVY_ATTACK_RANGE_Y,
  HEAVY_ATTACK_HITBOX_WIDTH,
} from "@my-beat/shared-types/game-config";
import { AttackType } from "@my-beat/shared-types/messages";
import type { AttackType as AttackTypeValue } from "@my-beat/shared-types/messages";

export class RemotePlayer extends Phaser.GameObjects.Container {
  private visualLayer: Phaser.GameObjects.Container;
  private attackHitbox: Phaser.GameObjects.Rectangle;
  private bodyRect: Phaser.GameObjects.Rectangle;
  private directionIndicator: Phaser.GameObjects.Triangle;
  private label: Phaser.GameObjects.Text;
  private targetX: number;
  private targetY: number;
  private facingRight = true;
  private localAttackTimer = 0;
  private localAttackType: AttackTypeValue | null = null;
  playerId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, playerId: string) {
    super(scene, x, y);
    this.playerId = playerId;
    this.targetX = x;
    this.targetY = y;

    this.visualLayer = scene.add.container(0, 0);
    this.add(this.visualLayer);

    // Green tint to distinguish from local player
    this.bodyRect = scene.add.rectangle(
      0,
      0,
      PLAYER_BODY_WIDTH,
      PLAYER_BODY_HEIGHT,
      0x33cc66,
    );
    this.bodyRect.setStrokeStyle(2, 0xffffff);
    this.visualLayer.add(this.bodyRect);

    this.attackHitbox = scene.add.rectangle(0, 0, 1, 1, 0xffff00, 0.48);
    this.attackHitbox.setStrokeStyle(3, 0xffee00, 1);
    this.attackHitbox.setVisible(false);
    this.visualLayer.add(this.attackHitbox);

    this.directionIndicator = scene.add.triangle(
      PLAYER_BODY_WIDTH / 2 + 6,
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
      .text(0, -PLAYER_BODY_HEIGHT / 2 - 14, "P2", {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5, 0.5);
    this.visualLayer.add(this.label);

    scene.add.existing(this);
    this.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT);
  }

  updateFromServer(
    x: number,
    y: number,
    facingRight: boolean,
    isAttacking: boolean,
    attackType: AttackTypeValue | null,
    attackTimer: number,
    jumpOffset: number,
  ): void {
    this.targetX = x;
    this.targetY = y;
    this.facingRight = facingRight;
    this.visualLayer.setY(Number.isFinite(jumpOffset) ? -jumpOffset : 0);

    if (facingRight) {
      this.directionIndicator.setPosition(PLAYER_BODY_WIDTH / 2 + 6, 0);
      this.directionIndicator.setTo(0, -6, 0, 6, 10, 0);
    } else {
      this.directionIndicator.setPosition(-PLAYER_BODY_WIDTH / 2 - 6, 0);
      this.directionIndicator.setTo(10, -6, 10, 6, 0, 0);
    }

    this.localAttackTimer = isAttacking
      ? this.getServerAttackTimer(attackTimer)
      : 0;
    this.localAttackType = isAttacking
      ? (attackType ?? AttackType.LIGHT)
      : null;
    this.updateAttackHitbox();

    this.bodyRect.setFillStyle(isAttacking ? 0x66ff99 : 0x33cc66);
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
      .setFillStyle(0xffff00, isHeavy ? 0.58 : 0.48)
      .setVisible(true);
  }

  private getServerAttackTimer(attackTimer: number): number {
    if (Number.isFinite(attackTimer) && attackTimer > 0) {
      return attackTimer;
    }

    return ATTACK_DURATION;
  }
}
