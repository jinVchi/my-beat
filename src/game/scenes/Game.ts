import Phaser from "phaser";
import { EventBus } from "../EventBus";
import Player from "../entities/Player";
import Enemy from "../entities/Enemy";

const FLOOR_TOP = 450;
const FLOOR_BOTTOM = 740;

export default class Game extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private depthSortGroup: Phaser.GameObjects.Container[] = [];

  constructor() {
    super("Game");
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

    // Sky
    g.fillStyle(0x4488cc);
    g.fillRect(0, 0, 1024, 300);

    // Distant buildings silhouette
    g.fillStyle(0x334455);
    g.fillRect(0, 200, 120, 100);
    g.fillRect(100, 170, 80, 130);
    g.fillRect(200, 210, 100, 90);
    g.fillRect(320, 180, 60, 120);
    g.fillRect(400, 200, 140, 100);
    g.fillRect(560, 190, 70, 110);
    g.fillRect(650, 210, 110, 90);
    g.fillRect(780, 175, 90, 125);
    g.fillRect(890, 200, 134, 100);

    // Wall / back area
    g.fillStyle(0x666655);
    g.fillRect(0, 300, 1024, 150);

    // Wall details - bricks pattern
    g.lineStyle(1, 0x555544, 0.4);
    for (let row = 0; row < 5; row++) {
      const y = 300 + row * 30;
      g.strokeLineShape(new Phaser.Geom.Line(0, y, 1024, y));
      const offset = row % 2 === 0 ? 0 : 30;
      for (let col = offset; col < 1024; col += 60) {
        g.strokeLineShape(new Phaser.Geom.Line(col, y, col, y + 30));
      }
    }

    // Floor / street
    g.fillStyle(0x888877);
    g.fillRect(0, FLOOR_TOP, 1024, FLOOR_BOTTOM - FLOOR_TOP + 28);

    // Sidewalk edge
    g.fillStyle(0x999988);
    g.fillRect(0, FLOOR_TOP, 1024, 12);

    // Street lane markings
    g.lineStyle(2, 0xaaaa88, 0.3);
    for (let x = 0; x < 1024; x += 80) {
      g.strokeLineShape(new Phaser.Geom.Line(x, 600, x + 40, 600));
    }

    g.setDepth(-1);
  }

  private spawnPlayer() {
    this.player = new Player(this, 150, 580);
    this.depthSortGroup.push(this.player);
  }

  private spawnEnemies() {
    const positions = [
      { x: 500, y: 540 },
      { x: 700, y: 620 },
      { x: 850, y: 560 },
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
          // One hit per attack swing
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
    // Remove destroyed objects
    this.depthSortGroup = this.depthSortGroup.filter((obj) => obj.active);

    for (const obj of this.depthSortGroup) {
      obj.setDepth(obj.y);
    }
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
