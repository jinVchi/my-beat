import type { WebSocket } from "ws";
import { simulateTick } from "@my-beat/game-logic";
import type { RoomState, SimPlayerState, SimEnemyState } from "@my-beat/game-logic/types";
import { encodeMessage } from "@my-beat/netcode/serializer";
import {
  PLAYER_MAX_HEALTH,
  ENEMY_DEFAULT_MAX_HEALTH,
} from "@my-beat/shared-types/game-config";
import {
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

export class Room {
  id: string;
  state: RoomState;
  private connections = new Map<string, PlayerConnection>();
  private inputQueue = new Map<string, ClientPlayerInput[]>();
  private lastProcessedSeq = new Map<string, number>();
  private enemySpawns: Array<{ x: number; y: number }>;

  constructor(id: string, enemies: Array<{ x: number; y: number }>) {
    this.id = id;
    this.enemySpawns = enemies;
    this.state = {
      tick: 0,
      players: new Map(),
      enemies: this.createEnemies(),
    };
  }

  private createEnemies(): SimEnemyState[] {
    return this.enemySpawns.map((pos, i): SimEnemyState => ({
      id: `enemy-${i}`,
      x: pos.x,
      y: pos.y,
      health: ENEMY_DEFAULT_MAX_HEALTH,
      maxHealth: ENEMY_DEFAULT_MAX_HEALTH,
      isDead: false,
    }));
  }

  private resetRoom(): void {
    this.state.tick = 0;
    this.state.enemies = this.createEnemies();
  }

  addPlayer(playerId: string, ws: PlayerConnection["ws"]): void {
    // Reset room when first player joins an empty room
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
      attackTimer: 0,
      attackCooldownTimer: 0,
      inputFlags: 0,
    };

    this.state.players.set(playerId, player);
    this.connections.set(playerId, { ws });
    this.inputQueue.set(playerId, []);
    this.lastProcessedSeq.set(playerId, 0);

    // Send ROOM_JOINED to the new player
    const joinMsg: ServerRoomJoined = {
      type: ServerMsgType.ROOM_JOINED,
      playerId,
      snapshot: this.buildSnapshot(),
    };
    this.send(ws, joinMsg);

    // Broadcast PLAYER_JOINED to others
    const playerState = this.toPlayerState(player);
    const joinedMsg: ServerPlayerJoined = {
      type: ServerMsgType.PLAYER_JOINED,
      player: playerState,
    };
    this.broadcast(joinedMsg, playerId);
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
        // No inputs: clear movement flags but keep timers
        if (player) {
          this.state.players.set(playerId, { ...player, inputFlags: 0 });
        }
        continue;
      }

      // For directional flags, use the last input's flags
      // For ATTACK, OR across all inputs so quick presses aren't lost
      let mergedFlags = queue[queue.length - 1].inputFlags;
      let maxSeq = 0;
      for (const input of queue) {
        mergedFlags |= input.inputFlags & 16; // OR the ATTACK bit
        if (input.seq > maxSeq) maxSeq = input.seq;
      }

      this.state.players.set(playerId, { ...player, inputFlags: mergedFlags });
      this.lastProcessedSeq.set(playerId, maxSeq);
      queue.length = 0; // Clear the queue
    }

    // Run simulation
    this.state = simulateTick(this.state);

    // Broadcast snapshot
    this.broadcastSnapshot();
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
      players,
      enemies: this.state.enemies,
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
