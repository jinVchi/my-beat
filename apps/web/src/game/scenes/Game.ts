import Phaser from "phaser";
import { EventBus } from "../EventBus";
import Player from "../entities/Player";
import Enemy from "../entities/Enemy";
import DroppedItem from "../entities/DroppedItem";
import { RemotePlayer } from "../entities/RemotePlayer";
import { GameClient } from "../network/ws-client";
import { InputFlag, type GameSnapshot, type PlayerState } from "@my-beat/shared-types/messages";
import { FLOOR_TOP, FLOOR_BOTTOM } from "@my-beat/shared-types/game-config";
import { addCornerQuitButton } from "../ui/corner-quit";
import { getSelectedRegion } from "../state/region-store";

export default class Game extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private remotePlayers = new Map<string, RemotePlayer>();
  private droppedItems = new Map<string, DroppedItem>();
  private depthSortGroup: Phaser.GameObjects.Container[] = [];
  private gameClient!: GameClient;
  private localPlayerId: string | null = null;

  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super("Game");
  }

  create() {
    this.player = undefined!;
    this.enemies = [];
    this.remotePlayers = new Map();
    this.droppedItems = new Map();
    this.depthSortGroup = [];
    this.localPlayerId = null;

    this.drawBackground();

    this.keys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      J: Phaser.Input.Keyboard.KeyCodes.J,
    }) as typeof this.keys;

    this.gameClient = new GameClient({
      onJoined: (playerId, snapshot) => {
        this.localPlayerId = playerId;
        this.applySnapshot(snapshot);
      },
      onSnapshot: (snapshot) => {
        this.applySnapshot(snapshot);
      },
      onPlayerJoined: (playerState) => {
        if (playerState.id !== this.localPlayerId) {
          this.addRemotePlayer(playerState);
        }
      },
      onPlayerLeft: (playerId) => {
        this.removeRemotePlayer(playerId);
      },
      onDisconnect: () => {
        console.log("Disconnected from server");
      },
    });

    const region = getSelectedRegion();
    this.gameClient.connect(region?.id ?? "JP");
    addCornerQuitButton(this, () => this.changeScene());

    this.events.on("shutdown", () => this.gameClient.disconnect());
    this.events.on("destroy", () => this.gameClient.disconnect());

    EventBus.emit("current-scene-ready", this);
  }

  update(_time: number, _delta: number) {
    let inputFlags = 0;
    if (this.keys.W.isDown) inputFlags |= InputFlag.UP;
    if (this.keys.S.isDown) inputFlags |= InputFlag.DOWN;
    if (this.keys.A.isDown) inputFlags |= InputFlag.LEFT;
    if (this.keys.D.isDown) inputFlags |= InputFlag.RIGHT;
    if (Phaser.Input.Keyboard.JustDown(this.keys.J))
      inputFlags |= InputFlag.ATTACK | InputFlag.PICKUP;

    this.gameClient.sendInput(inputFlags);
    this.depthSort();
  }

  private applySnapshot(snapshot: GameSnapshot): void {
    try {
      if (!this.scene?.isActive()) return;
    } catch {
      return;
    }

    // Update local player
    const localState = snapshot.players.find((p) => p.id === this.localPlayerId);
    if (localState) {
      if (!this.player) {
        this.player = new Player(this, localState.x, localState.y);
        this.depthSortGroup.push(this.player);
      }
      this.player.updateFromServer(
        localState.x,
        localState.y,
        localState.facingRight,
        localState.isAttacking,
        localState.health,
      );
    }

    // Update remote players
    for (const ps of snapshot.players) {
      if (ps.id === this.localPlayerId) continue;

      let remote = this.remotePlayers.get(ps.id);
      if (!remote) {
        remote = this.addRemotePlayer(ps);
      }
      remote.updateFromServer(ps.x, ps.y, ps.facingRight, ps.isAttacking);
    }

    // Remove players no longer in snapshot
    const activeIds = new Set(snapshot.players.map((p) => p.id));
    for (const [id] of this.remotePlayers) {
      if (!activeIds.has(id)) {
        this.removeRemotePlayer(id);
      }
    }

    // Update enemies
    for (const es of snapshot.enemies) {
      const idx = parseInt(es.id.split("-")[1]);
      let enemy = this.enemies[idx];

      if ((!enemy || !enemy.active) && !es.isDead) {
        enemy = new Enemy(this, es.x, es.y, es.maxHealth);
        this.enemies[idx] = enemy;
        this.depthSortGroup.push(enemy);
      }

      if (enemy && enemy.active) {
        enemy.updateFromServer(
          es.health,
          es.isDead,
          es.x,
          es.y,
          es.isWarning,
          es.isAttacking,
          es.warningTimer,
        );
      }
    }

    // Update dropped items
    const items = snapshot.items ?? [];
    const activeItemIds = new Set<string>();
    for (const itemState of items) {
      activeItemIds.add(itemState.id);
      if (!this.droppedItems.has(itemState.id)) {
        const item = new DroppedItem(
          this,
          itemState.x,
          itemState.y,
          itemState.itemId,
          itemState.id,
        );
        this.droppedItems.set(itemState.id, item);
        this.depthSortGroup.push(item);
      }
    }
    for (const [id, item] of this.droppedItems) {
      if (!activeItemIds.has(id)) {
        item.destroy();
        this.droppedItems.delete(id);
      }
    }
  }

  private addRemotePlayer(ps: PlayerState): RemotePlayer {
    const remote = new RemotePlayer(this, ps.x, ps.y, ps.id);
    this.remotePlayers.set(ps.id, remote);
    this.depthSortGroup.push(remote);
    return remote;
  }

  private removeRemotePlayer(playerId: string): void {
    const remote = this.remotePlayers.get(playerId);
    if (remote) {
      remote.destroy();
      this.remotePlayers.delete(playerId);
    }
  }

  private drawBackground() {
    const g = this.add.graphics();

    g.fillStyle(0x4488cc);
    g.fillRect(0, 0, 1024, 300);

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

    g.fillStyle(0x666655);
    g.fillRect(0, 300, 1024, 150);

    g.lineStyle(1, 0x555544, 0.4);
    for (let row = 0; row < 5; row++) {
      const y = 300 + row * 30;
      g.strokeLineShape(new Phaser.Geom.Line(0, y, 1024, y));
      const offset = row % 2 === 0 ? 0 : 30;
      for (let col = offset; col < 1024; col += 60) {
        g.strokeLineShape(new Phaser.Geom.Line(col, y, col, y + 30));
      }
    }

    g.fillStyle(0x888877);
    g.fillRect(0, FLOOR_TOP, 1024, FLOOR_BOTTOM - FLOOR_TOP + 28);

    g.fillStyle(0x999988);
    g.fillRect(0, FLOOR_TOP, 1024, 12);

    g.lineStyle(2, 0xaaaa88, 0.3);
    for (let x = 0; x < 1024; x += 80) {
      g.strokeLineShape(new Phaser.Geom.Line(x, 600, x + 40, 600));
    }

    g.setDepth(-1);
  }

  private depthSort() {
    this.depthSortGroup = this.depthSortGroup.filter((obj) => obj.active);
    for (const obj of this.depthSortGroup) {
      obj.setDepth(obj.y);
    }
  }

  changeScene() {
    this.gameClient.disconnect();
    this.scene.start("GameOver");
  }
}
