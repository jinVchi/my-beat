import Phaser from "phaser";
import { EventBus } from "../EventBus";
import Player from "../entities/Player";
import Enemy from "../entities/Enemy";

const FLOOR_TOP = 450;
const FLOOR_BOTTOM = 740;

export default class Game2 extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private depthSortGroup: Phaser.GameObjects.Container[] = [];

  constructor() {
    super("Game2");
  }

  create() {
    this.drawBackground();
    this.spawnPlayer();
    this.spawnEnemies();
    this.setupAttackOverlap();

    EventBus.emit("current-scene-ready", this);
  }

  update(time: number, delta: number) {
    this.player.update(time, delta);
    this.clampToFloor(this.player);
    this.depthSort();
  }

  private drawBackground() {
    const g = this.add.graphics();

    // Sky - darker/evening tone for second scene
    g.fillStyle(0x334488);
    g.fillRect(0, 0, 1024, 300);

    // Distant buildings silhouette
    g.fillStyle(0x223344);
    g.fillRect(0, 190, 100, 110);
    g.fillRect(120, 160, 90, 140);
    g.fillRect(230, 205, 110, 95);
    g.fillRect(360, 175, 70, 125);
    g.fillRect(450, 195, 150, 105);
    g.fillRect(620, 185, 80, 115);
    g.fillRect(720, 205, 120, 95);
    g.fillRect(860, 170, 100, 130);
    g.fillRect(980, 195, 44, 105);

    // Wall / back area
    g.fillStyle(0x555566);
    g.fillRect(0, 300, 1024, 150);

    // Wall details - bricks pattern
    g.lineStyle(1, 0x444455, 0.4);
    for (let row = 0; row < 5; row++) {
      const y = 300 + row * 30;
      g.strokeLineShape(new Phaser.Geom.Line(0, y, 1024, y));
      const offset = row % 2 === 0 ? 0 : 30;
      for (let col = offset; col < 1024; col += 60) {
        g.strokeLineShape(new Phaser.Geom.Line(col, y, col, y + 30));
      }
    }

    // Floor / street
    g.fillStyle(0x777788);
    g.fillRect(0, FLOOR_TOP, 1024, FLOOR_BOTTOM - FLOOR_TOP + 28);

    // Sidewalk edge
    g.fillStyle(0x888899);
    g.fillRect(0, FLOOR_TOP, 1024, 12);

    // Street lane markings
    g.lineStyle(2, 0x9999aa, 0.3);
    for (let x = 0; x < 1024; x += 80) {
      g.strokeLineShape(new Phaser.Geom.Line(x, 600, x + 40, 600));
    }

    // Scene label
    this.add
      .text(512, 30, "STAGE 2", {
        fontSize: "20px",
        color: "#aaaaff",
        fontFamily: "Arial Black",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    g.setDepth(-1);
  }

  private spawnPlayer() {
    this.player = new Player(this, 80, 580);
    this.depthSortGroup.push(this.player);
  }

  private spawnEnemies() {
    const positions = [
      { x: 400, y: 520 },
      { x: 600, y: 580 },
      { x: 750, y: 540 },
      { x: 880, y: 610 },
      { x: 550, y: 650 },
    ];

    for (const pos of positions) {
      const enemy = new Enemy(this, pos.x, pos.y);
      this.enemies.push(enemy);
      this.depthSortGroup.push(enemy);
    }
  }

  private setupAttackOverlap() {
    this.physics.world.on("worldstep", () => {
      if (!this.player.attackHitbox) return;

      const hitbox = this.player.attackHitbox;
      const hitboxBody = hitbox.body as Phaser.Physics.Arcade.Body;
      if (!hitboxBody) return;

      for (const enemy of this.enemies) {
        if (enemy.getIsDead() || !enemy.active) continue;

        const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
        if (!enemyBody) continue;

        if (this.physics.overlap(hitbox, enemy)) {
          enemy.takeDamage(this.player.getAttackDamage());
          this.player.attackHitbox?.destroy();
          this.player.attackHitbox = null;
          break;
        }
      }
    });
  }

  private clampToFloor(obj: Phaser.GameObjects.Container) {
    const halfH = 32;
    if (obj.y - halfH < FLOOR_TOP) obj.y = FLOOR_TOP + halfH;
    if (obj.y + halfH > FLOOR_BOTTOM) obj.y = FLOOR_BOTTOM - halfH;
    if (obj.x < 30) obj.x = 30;
    if (obj.x > 994) obj.x = 994;
  }

  private depthSort() {
    this.depthSortGroup = this.depthSortGroup.filter((obj) => obj.active);
    for (const obj of this.depthSortGroup) {
      obj.setDepth(obj.y);
    }
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
