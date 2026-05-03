import type { WebSocket } from "ws";
import { simulateTick } from "@my-beat/game-logic";
import type { RoomState, SimPlayerState, SimEnemyState, SimItemState } from "@my-beat/game-logic/types";
import { encodeMessage } from "@my-beat/netcode/serializer";
import {
  DEFAULT_STAGE_ID,
  MAX_PLAYERS_PER_ROOM,
  PLAYER_MAX_HEALTH,
  ENEMY_DEFAULT_MAX_HEALTH,
  ITEM_IDS,
  WORLD_LEFT,
  WORLD_RIGHT,
  getStageConfig,
} from "@my-beat/shared-types/game-config";
import type { ItemId, StageId } from "@my-beat/shared-types/game-config";
import {
  InputFlag,
  ServerMsgType,
  type ClientPlayerInput,
  type GameSnapshot,
  type PlayerState,
  type ServerGameSnapshot,
  type ServerPlayerJoined,
  type ServerPlayerLeft,
  type ServerRoomJoined,
} from "@my-beat/shared-types/messages";

export type PlayerConnection = {
  ws: WebSocket;
};

export type PendingItemWrite = {
  playerId: string;
  itemId: string;
  roomId: string;
  pickedUpAt: number;
};

const FLUSH_URL =
  process.env.GLOBAL_API_URL ?? "http://localhost:3002";

export class Room {
  id: string;
  state: RoomState;
  private connections = new Map<string, PlayerConnection>();
  private inputQueue = new Map<string, ClientPlayerInput[]>();
  private lastProcessedSeq = new Map<string, number>();
  private reservedSlots = new Map<string, number>();
  private itemCounter = 0;
  pendingWrites: PendingItemWrite[] = [];

  constructor(id: string) {
    this.id = id;
    this.state = {
      tick: 0,
      stageId: DEFAULT_STAGE_ID,
      players: new Map(),
      enemies: this.createEnemies(DEFAULT_STAGE_ID),
      items: [],
    };
  }

  private createEnemies(stageId: StageId): SimEnemyState[] {
    return getStageConfig(stageId).enemies.map((pos, i): SimEnemyState => ({
      id: `enemy-${i}`,
      x: pos.x,
      y: pos.y,
      health: ENEMY_DEFAULT_MAX_HEALTH,
      maxHealth: ENEMY_DEFAULT_MAX_HEALTH,
      isDead: false,
      isWarning: false,
      isAttacking: false,
      warningTimer: 0,
      attackTimer: 0,
      attackCooldownTimer: 0,
    }));
  }

  private resetRoom(): void {
    this.state.tick = 0;
    this.state.stageId = DEFAULT_STAGE_ID;
    this.state.enemies = this.createEnemies(DEFAULT_STAGE_ID);
    this.state.items = [];
    this.itemCounter = 0;
  }

  get isFull(): boolean {
    return this.connections.size >= MAX_PLAYERS_PER_ROOM;
  }

  reserveSlot(playerId: string): boolean {
    this.expireReservations();
    if (this.reservedSlots.has(playerId)) return true;
    if (this.connections.size + this.reservedSlots.size >= MAX_PLAYERS_PER_ROOM) return false;
    this.reservedSlots.set(playerId, Date.now());
    return true;
  }

  releaseSlot(playerId: string): void {
    this.reservedSlots.delete(playerId);
  }

  private expireReservations(): void {
    const now = Date.now();
    for (const [id, ts] of this.reservedSlots) {
      if (now - ts > 10_000) {
        this.reservedSlots.delete(id);
      }
    }
  }

  get availableSlots(): number {
    this.expireReservations();
    return MAX_PLAYERS_PER_ROOM - this.connections.size - this.reservedSlots.size;
  }

  addPlayer(playerId: string, ws: PlayerConnection["ws"]): boolean {
    const existing = this.connections.get(playerId);
    if (existing) {
      existing.ws.close(4001, "Duplicate connection");
    }

    this.reservedSlots.delete(playerId);
    if (this.connections.size >= MAX_PLAYERS_PER_ROOM) return false;

    if (this.connections.size === 0) {
      this.resetRoom();
    }
    const player: SimPlayerState = {
      id: playerId,
      x: 150,
      y: 580,
      facingRight: true,
      health: PLAYER_MAX_HEALTH,
      isAttacking: false,
      attackType: null,
      attackTimer: 0,
      attackCooldownTimer: 0,
      isJumping: false,
      jumpTimer: 0,
      jumpOffset: 0,
      inputFlags: 0,
    };

    this.state.players.set(playerId, player);
    this.connections.set(playerId, { ws });
    this.inputQueue.set(playerId, []);
    this.lastProcessedSeq.set(playerId, 0);

    const joinMsg: ServerRoomJoined = {
      type: ServerMsgType.ROOM_JOINED,
      playerId,
      snapshot: this.buildSnapshot(),
    };
    this.send(ws, joinMsg);

    const playerState = this.toPlayerState(player);
    const joinedMsg: ServerPlayerJoined = {
      type: ServerMsgType.PLAYER_JOINED,
      player: playerState,
    };
    this.broadcast(joinedMsg, playerId);
    return true;
  }

  removePlayer(playerId: string): void {
    this.state.players.delete(playerId);
    this.connections.delete(playerId);
    this.inputQueue.delete(playerId);
    this.lastProcessedSeq.delete(playerId);

    const leftMsg: ServerPlayerLeft = {
      type: ServerMsgType.PLAYER_LEFT,
      playerId,
    };
    this.broadcast(leftMsg);

    if (this.connections.size === 0) {
      this.flushPendingWrites();
    }
  }

  queueInput(playerId: string, input: ClientPlayerInput): void {
    const queue = this.inputQueue.get(playerId);
    if (queue) {
      queue.push(input);
    }
  }

  tick(): void {
    // Merge queued inputs for each player
    for (const [playerId, queue] of this.inputQueue) {
      const player = this.state.players.get(playerId);
      if (!player || queue.length === 0) {
        if (player) {
          this.state.players.set(playerId, { ...player, inputFlags: 0 });
        }
        continue;
      }

      let mergedFlags = queue[queue.length - 1].inputFlags;
      let maxSeq = 0;
      for (const input of queue) {
        mergedFlags |=
          input.inputFlags &
          (
            InputFlag.ATTACK |
            InputFlag.HEAVY_ATTACK |
            InputFlag.PICKUP |
            InputFlag.JUMP
          );
        if (input.seq > maxSeq) maxSeq = input.seq;
      }

      this.state.players.set(playerId, { ...player, inputFlags: mergedFlags });
      this.lastProcessedSeq.set(playerId, maxSeq);
      queue.length = 0;
    }

    // Snapshot enemy alive states before simulation
    const wasAlive = this.state.enemies.map((e) => !e.isDead);

    // Run simulation (handles combat + pickups)
    const { state, pickups } = simulateTick(this.state);
    this.state = state;
    this.advanceStageIfExitReached();

    // Record picked-up items for DB flush
    for (const pickup of pickups) {
      this.pendingWrites.push({
        playerId: pickup.playerId,
        itemId: pickup.itemType,
        roomId: this.id,
        pickedUpAt: Date.now(),
      });
    }

    // Spawn items for newly dead enemies
    for (let i = 0; i < this.state.enemies.length; i++) {
      if (wasAlive[i] && this.state.enemies[i].isDead) {
        this.spawnRandomItem(
          this.state.enemies[i].x,
          this.state.enemies[i].y,
        );
      }
    }

    this.broadcastSnapshot();
  }

  private advanceStageIfExitReached(): void {
    const currentStage = getStageConfig(this.state.stageId);
    if (!currentStage.hasExit) return;

    const reachedExit = [...this.state.players.values()].some(
      (player) => player.x >= WORLD_RIGHT - 1,
    );
    if (!reachedExit) return;

    const nextStageId = (this.state.stageId + 1) as StageId;
    const nextStage = getStageConfig(nextStageId);
    if (nextStage.id === this.state.stageId) return;

    const players = new Map<string, SimPlayerState>();
    for (const [id, player] of this.state.players) {
      players.set(id, {
        ...player,
        x: WORLD_LEFT + 120,
        y: 580,
        facingRight: true,
        isAttacking: false,
        attackType: null,
        attackTimer: 0,
        isJumping: false,
        jumpTimer: 0,
        jumpOffset: 0,
        inputFlags: 0,
      });
    }

    this.state = {
      tick: this.state.tick,
      stageId: nextStage.id,
      players,
      enemies: this.createEnemies(nextStage.id),
      items: [],
    };
    this.itemCounter = 0;
  }

  private spawnRandomItem(x: number, y: number): void {
    const itemId = ITEM_IDS[Math.floor(Math.random() * ITEM_IDS.length)];
    const item: SimItemState = {
      id: `item-${this.itemCounter++}`,
      itemId,
      x,
      y,
    };
    this.state.items.push(item);
  }

  async flushPendingWrites(): Promise<void> {
    if (this.pendingWrites.length === 0) return;
    const writes = this.pendingWrites.splice(0);
    try {
      const res = await fetch(`${FLUSH_URL}/api/items/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: writes }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      console.log(`Flushed ${writes.length} item writes for room ${this.id}`);
    } catch (e) {
      console.error(`Failed to flush item writes for room ${this.id}:`, e);
      this.pendingWrites.unshift(...writes);
    }
  }

  get playerCount(): number {
    return this.connections.size;
  }

  private broadcastSnapshot(): void {
    const lastProcessedInput: Record<string, number> = {};
    for (const [id, seq] of this.lastProcessedSeq) {
      lastProcessedInput[id] = seq;
    }

    const msg: ServerGameSnapshot = {
      type: ServerMsgType.GAME_SNAPSHOT,
      snapshot: this.buildSnapshot(),
      lastProcessedInput,
    };
    this.broadcast(msg);
  }

  private buildSnapshot(): GameSnapshot {
    const players: PlayerState[] = [];
    for (const p of this.state.players.values()) {
      players.push(this.toPlayerState(p));
    }

    return {
      tick: this.state.tick,
      stageId: this.state.stageId,
      players,
      enemies: this.state.enemies.map((e) => ({
        id: e.id,
        x: e.x,
        y: e.y,
        health: e.health,
        maxHealth: e.maxHealth,
        isDead: e.isDead,
        isWarning: e.isWarning,
        isAttacking: e.isAttacking,
        warningTimer: e.warningTimer,
      })),
      items: this.state.items.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        x: item.x,
        y: item.y,
      })),
    };
  }

  private toPlayerState(p: SimPlayerState): PlayerState {
    return {
      id: p.id,
      x: p.x,
      y: p.y,
      facingRight: p.facingRight,
      health: p.health,
      isAttacking: p.isAttacking,
      attackType: p.attackType,
      attackTimer: p.attackTimer,
      isJumping: p.isJumping,
      jumpOffset: p.jumpOffset,
    };
  }

  private send(ws: PlayerConnection["ws"], msg: object): void {
    const data = encodeMessage(msg as any);
    ws.send(data);
  }

  private broadcast(msg: object, excludeId?: string): void {
    const data = encodeMessage(msg as any);
    for (const [id, conn] of this.connections) {
      if (id === excludeId) continue;
      conn.ws.send(data);
    }
  }
}
