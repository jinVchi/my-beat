import Phaser from "phaser";
import {
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
} from "@my-beat/shared-types/game-config";

const BODY_WIDTH = PLAYER_BODY_WIDTH;
const BODY_HEIGHT = PLAYER_BODY_HEIGHT;

export default class Player extends Phaser.GameObjects.Container {
  private bodyRect: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private facingRight = true;
  private directionIndicator: Phaser.GameObjects.Triangle;

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

    scene.add.existing(this);
    this.setSize(BODY_WIDTH, BODY_HEIGHT);
  }

  updateFromServer(
    x: number,
    y: number,
    facingRight: boolean,
    isAttacking: boolean,
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
  }
}
