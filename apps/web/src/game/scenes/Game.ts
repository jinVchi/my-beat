import Phaser from "phaser";
import { EventBus } from "../EventBus";
import Player from "../entities/Player";
import Enemy from "../entities/Enemy";
import DroppedItem from "../entities/DroppedItem";
import { RemotePlayer } from "../entities/RemotePlayer";
import { GameClient, type GameClientCallbacks } from "../network/ws-client";
import {
  AttackType,
  InputFlag,
  type GameSnapshot,
  type PlayerState,
} from "@my-beat/shared-types/messages";
import {
  FLOOR_BOTTOM,
  FLOOR_TOP,
  WORLD_HEIGHT,
  WORLD_RIGHT,
  WORLD_WIDTH,
  getStageConfig,
  type StageConfig,
  type StageId,
} from "@my-beat/shared-types/game-config";
import { addCornerQuitButton } from "../ui/corner-quit";
import { getSelectedRegion } from "../state/region-store";

type BattleSceneKey = "Game" | "Game2";

type BattleSceneData = {
  gameClient?: GameClient;
  localPlayerId?: string | null;
  snapshot?: GameSnapshot;
};

export default class Game extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private remotePlayers = new Map<string, RemotePlayer>();
  private droppedItems = new Map<string, DroppedItem>();
  private depthSortGroup: Phaser.GameObjects.Container[] = [];
  private gameClient!: GameClient;
  private localPlayerId: string | null = null;
  private carriedGameClient?: GameClient;
  private carriedSnapshot?: GameSnapshot;
  private carriedLocalPlayerId: string | null = null;
  private isTransitioningBattleScene = false;
  private cameraFollowingPlayer = false;

  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
    K: Phaser.Input.Keyboard.Key;
    L: Phaser.Input.Keyboard.Key;
  };

  constructor(
    sceneKey: BattleSceneKey = "Game",
    private readonly expectedStageId: StageId = 1,
  ) {
    super(sceneKey);
  }

  init(data: BattleSceneData = {}) {
    this.carriedGameClient = data.gameClient;
    this.carriedLocalPlayerId = data.localPlayerId ?? null;
    this.carriedSnapshot = data.snapshot;
  }

  create() {
    this.player = undefined!;
    this.enemies = [];
    this.remotePlayers = new Map();
    this.droppedItems = new Map();
    this.depthSortGroup = [];
    this.localPlayerId = this.carriedLocalPlayerId;
    this.isTransitioningBattleScene = false;
    this.cameraFollowingPlayer = false;

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawBackground(getStageConfig(this.expectedStageId));
    this.addStageTitle(getStageConfig(this.expectedStageId));
    this.addGoArrow(getStageConfig(this.expectedStageId));

    this.keys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      J: Phaser.Input.Keyboard.KeyCodes.J,
      K: Phaser.Input.Keyboard.KeyCodes.K,
      L: Phaser.Input.Keyboard.KeyCodes.L,
    }) as typeof this.keys;

    const callbacks = this.createClientCallbacks();
    if (this.carriedGameClient) {
      this.gameClient = this.carriedGameClient;
      this.gameClient.setCallbacks(callbacks);
    } else {
      this.gameClient = new GameClient(callbacks);
      const region = getSelectedRegion();
      void this.gameClient.connect(region?.id ?? "JP");
    }

    addCornerQuitButton(this, () => this.changeScene());

    this.events.once("shutdown", () => {
      if (!this.isTransitioningBattleScene) {
        this.gameClient.disconnect();
      }
    });
    this.events.once("destroy", () => {
      if (!this.isTransitioningBattleScene) {
        this.gameClient.disconnect();
      }
    });

    if (this.carriedSnapshot) {
      this.applySnapshot(this.carriedSnapshot);
    }

    EventBus.emit("current-scene-ready", this);
  }

  update(_time: number, _delta: number) {
    let inputFlags = 0;
    if (this.keys.W.isDown) inputFlags |= InputFlag.UP;
    if (this.keys.S.isDown) inputFlags |= InputFlag.DOWN;
    if (this.keys.A.isDown) inputFlags |= InputFlag.LEFT;
    if (this.keys.D.isDown) inputFlags |= InputFlag.RIGHT;
    if (Phaser.Input.Keyboard.JustDown(this.keys.J)) {
      inputFlags |= InputFlag.ATTACK | InputFlag.PICKUP;
      this.player?.showAttackPreview(AttackType.LIGHT);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
      inputFlags |= InputFlag.JUMP;
      this.player?.showJumpPreview();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.L)) {
      inputFlags |= InputFlag.HEAVY_ATTACK;
      this.player?.showAttackPreview(AttackType.HEAVY);
    }

    this.gameClient.sendInput(inputFlags);
    this.smoothEntities(_delta);
    this.depthSort();
  }

  private createClientCallbacks(): GameClientCallbacks {
    return {
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
    };
  }

  private applySnapshot(snapshot: GameSnapshot): void {
    try {
      if (!this.scene?.isActive()) return;
    } catch {
      return;
    }

    if (this.transitionToStageScene(snapshot)) return;

    const localState = snapshot.players.find((p) => p.id === this.localPlayerId);
    if (localState) {
      if (!this.player) {
        this.player = new Player(this, localState.x, localState.y);
        this.depthSortGroup.push(this.player);
        this.configureCameraFollow();
      }
      this.player.updateFromServer(
        localState.x,
        localState.y,
        localState.facingRight,
        localState.isAttacking,
        localState.attackType,
        localState.attackTimer,
        localState.jumpOffset,
        localState.health,
      );
    }

    for (const ps of snapshot.players) {
      if (ps.id === this.localPlayerId) continue;

      let remote = this.remotePlayers.get(ps.id);
      if (!remote) {
        remote = this.addRemotePlayer(ps);
      }
      remote.updateFromServer(
        ps.x,
        ps.y,
        ps.facingRight,
        ps.isAttacking,
        ps.attackType,
        ps.attackTimer,
        ps.jumpOffset,
      );
    }

    const activeIds = new Set(snapshot.players.map((p) => p.id));
    for (const [id] of this.remotePlayers) {
      if (!activeIds.has(id)) {
        this.removeRemotePlayer(id);
      }
    }

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

  private transitionToStageScene(snapshot: GameSnapshot): boolean {
    const targetScene = this.getSceneKeyForStage(snapshot.stageId);
    if (targetScene === this.scene.key) return false;

    this.isTransitioningBattleScene = true;
    this.scene.start(targetScene, {
      gameClient: this.gameClient,
      localPlayerId: this.localPlayerId,
      snapshot,
    } satisfies BattleSceneData);
    return true;
  }

  private getSceneKeyForStage(stageId: StageId): BattleSceneKey {
    return stageId === 2 ? "Game2" : "Game";
  }

  private configureCameraFollow(): void {
    if (this.cameraFollowingPlayer) return;

    const camera = this.cameras.main;
    camera.startFollow(this.player, false, 0.14, 0.14);
    camera.setDeadzone(640, WORLD_HEIGHT);
    this.cameraFollowingPlayer = true;
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

  private drawBackground(stage: StageConfig) {
    const g = this.add.graphics();

    g.fillStyle(stage.skyColor);
    g.fillRect(0, 0, WORLD_WIDTH, 300);

    g.fillStyle(stage.skylineColor);
    let x = -20;
    const widths = [120, 80, 110, 70, 150, 90, 130, 100];
    const heights = [100, 130, 90, 120, 105, 140, 85, 125];
    for (let i = 0; x < WORLD_WIDTH; i++) {
      const width = widths[i % widths.length];
      const height = heights[i % heights.length];
      g.fillRect(x, 300 - height, width, height);
      x += width + 10;
    }

    g.fillStyle(stage.streetColor);
    g.fillRect(0, 300, WORLD_WIDTH, 150);

    g.lineStyle(1, 0x555544, 0.4);
    for (let row = 0; row < 5; row++) {
      const y = 300 + row * 30;
      g.strokeLineShape(new Phaser.Geom.Line(0, y, WORLD_WIDTH, y));
      const offset = row % 2 === 0 ? 0 : 30;
      for (let col = offset; col < WORLD_WIDTH; col += 60) {
        g.strokeLineShape(new Phaser.Geom.Line(col, y, col, y + 30));
      }
    }

    g.fillStyle(stage.floorColor);
    g.fillRect(0, FLOOR_TOP, WORLD_WIDTH, FLOOR_BOTTOM - FLOOR_TOP + 28);

    g.fillStyle(stage.floorHighlightColor);
    g.fillRect(0, FLOOR_TOP, WORLD_WIDTH, 12);

    g.lineStyle(2, stage.floorHighlightColor, 0.3);
    for (let floorX = 0; floorX < WORLD_WIDTH; floorX += 80) {
      g.strokeLineShape(new Phaser.Geom.Line(floorX, 600, floorX + 40, 600));
    }

    g.setDepth(-1);
  }

  private addStageTitle(stage: StageConfig): void {
    this.add
      .text(18, 16, stage.name, {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial Black",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setScrollFactor(0)
      .setDepth(10_000);
  }

  private addGoArrow(stage: StageConfig): void {
    if (!stage.hasExit) return;

    const arrow = this.add.container(WORLD_RIGHT - 54, FLOOR_TOP + 118);
    const label = this.add
      .text(0, -52, "GO", {
        fontSize: "30px",
        color: "#ffff66",
        fontFamily: "Arial Black",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0.5);
    const head = this.add.triangle(0, 0, -24, -30, -24, 30, 34, 0, 0xffff00);
    head.setStrokeStyle(4, 0x000000);

    arrow.add([label, head]);
    arrow.setDepth(9_000);

    this.tweens.add({
      targets: arrow,
      x: WORLD_RIGHT - 28,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private depthSort() {
    this.depthSortGroup = this.depthSortGroup.filter((obj) => obj.active);
    for (const obj of this.depthSortGroup) {
      obj.setDepth(obj.y);
    }
  }

  private smoothEntities(deltaMs: number): void {
    if (this.player?.active) {
      this.player.smoothUpdate(deltaMs);
    }

    for (const remote of this.remotePlayers.values()) {
      if (remote.active) {
        remote.smoothUpdate(deltaMs);
      }
    }

    for (const enemy of this.enemies) {
      if (enemy?.active) {
        enemy.smoothUpdate(deltaMs);
      }
    }
  }

  changeScene() {
    this.gameClient.disconnect();
    this.scene.start("GameOver");
  }
}
