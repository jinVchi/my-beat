import Phaser from "phaser";
import {
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
} from "@my-beat/shared-types/game-config";

export class RemotePlayer extends Phaser.GameObjects.Container {
  private bodyRect: Phaser.GameObjects.Rectangle;
  private directionIndicator: Phaser.GameObjects.Triangle;
  private label: Phaser.GameObjects.Text;
  private targetX: number;
  private targetY: number;
  playerId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, playerId: string) {
    super(scene, x, y);
    this.playerId = playerId;
    this.targetX = x;
    this.targetY = y;

    // Green tint to distinguish from local player
    this.bodyRect = scene.add.rectangle(
      0,
      0,
      PLAYER_BODY_WIDTH,
      PLAYER_BODY_HEIGHT,
      0x33cc66,
    );
    this.bodyRect.setStrokeStyle(2, 0xffffff);
    this.add(this.bodyRect);

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
    this.add(this.directionIndicator);

    this.label = scene.add
      .text(0, -PLAYER_BODY_HEIGHT / 2 - 14, "P2", {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5, 0.5);
    this.add(this.label);

    scene.add.existing(this);
    this.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT);
  }

  updateFromServer(
    x: number,
    y: number,
    facingRight: boolean,
    isAttacking: boolean,
  ): void {
    this.targetX = x;
    this.targetY = y;

    if (facingRight) {
      this.directionIndicator.setPosition(PLAYER_BODY_WIDTH / 2 + 6, 0);
      this.directionIndicator.setTo(0, -6, 0, 6, 10, 0);
    } else {
      this.directionIndicator.setPosition(-PLAYER_BODY_WIDTH / 2 - 6, 0);
      this.directionIndicator.setTo(10, -6, 10, 6, 0, 0);
    }

    this.bodyRect.setFillStyle(isAttacking ? 0x66ff99 : 0x33cc66);
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
}
