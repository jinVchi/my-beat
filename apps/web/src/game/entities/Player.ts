import Phaser from "phaser";
import {
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
  PLAYER_MAX_HEALTH,
} from "@my-beat/shared-types/game-config";

const BODY_WIDTH = PLAYER_BODY_WIDTH;
const BODY_HEIGHT = PLAYER_BODY_HEIGHT;
const SPRITE_Y_OFFSET = -8;

export default class Player extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;
  private facingRight = true;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private health = PLAYER_MAX_HEALTH;
  private maxHealth = PLAYER_MAX_HEALTH;
  private isHitAnimating = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.sprite = scene.add.sprite(0, SPRITE_Y_OFFSET, "player-fighter", 0);
    this.sprite.play("player-idle");
    this.add(this.sprite);

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
    const moved =
      Math.abs(x - this.x) > 0.5 || Math.abs(y - this.y) > 0.5;

    this.x = x;
    this.y = y;
    this.facingRight = facingRight;
    this.sprite.setFlipX(!this.facingRight);

    // Health
    if (health < this.health) {
      this.flashHit();
    }
    this.health = health;
    this.updateHealthBar();
    this.updateAnimation(moved, isAttacking);
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
    this.isHitAnimating = true;
    this.sprite.setTintFill(0xffffff);
    this.sprite.play("player-hit", true);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.sprite.clearTint();
        this.isHitAnimating = false;
      }
    });
  }

  private updateAnimation(moved: boolean, isAttacking: boolean) {
    if (this.health <= 0) {
      this.sprite.play("player-ko", true);
      return;
    }

    if (this.isHitAnimating) {
      this.sprite.play("player-hit", true);
      return;
    }

    if (isAttacking) {
      this.sprite.play("player-attack", true);
      return;
    }

    this.sprite.play(moved ? "player-walk" : "player-idle", true);
  }
}
