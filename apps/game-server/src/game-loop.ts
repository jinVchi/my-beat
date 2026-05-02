import { SERVER_TICK_MS, MAX_PLAYERS_PER_ROOM } from "@my-beat/shared-types/game-config";
import type { RegionId } from "@my-beat/shared-types/game-config";
import { nanoid } from "nanoid";
import { Room } from "./room";

const FLUSH_INTERVAL_MS = 30_000;

export type RoomInfo = {
  id: string;
  region: RegionId;
  playerCount: number;
  maxPlayers: number;
};

export class GameLoop {
  private rooms = new Map<string, Room>();
  private roomRegions = new Map<string, RegionId>();
  private interval: ReturnType<typeof setInterval> | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  createRoom(region: RegionId): Room {
    const id = `${region.toLowerCase()}-${nanoid(8)}`;
    const room = new Room(id);
    this.rooms.set(id, room);
    this.roomRegions.set(id, region);
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  findOrCreateRoom(region: RegionId, playerId: string): Room {
    for (const [id, room] of this.rooms) {
      if (
        this.roomRegions.get(id) === region &&
        room.availableSlots > 0
      ) {
        room.reserveSlot(playerId);
        return room;
      }
    }
    const room = this.createRoom(region);
    room.reserveSlot(playerId);
    return room;
  }

  listRooms(region?: RegionId): RoomInfo[] {
    const result: RoomInfo[] = [];
    for (const [id, room] of this.rooms) {
      const r = this.roomRegions.get(id)!;
      if (region && r !== region) continue;
      result.push({
        id,
        region: r,
        playerCount: room.playerCount,
        maxPlayers: MAX_PLAYERS_PER_ROOM,
      });
    }
    return result;
  }

  removeEmptyRooms(): void {
    for (const [id, room] of this.rooms) {
      if (room.playerCount === 0) {
        this.rooms.delete(id);
        this.roomRegions.delete(id);
      }
    }
  }

  start(): void {
    this.interval = setInterval(() => {
      for (const room of this.rooms.values()) {
        if (room.playerCount > 0) {
          room.tick();
        }
      }
    }, SERVER_TICK_MS);

    this.cleanupInterval = setInterval(() => this.removeEmptyRooms(), 30_000);

    this.flushInterval = setInterval(() => {
      for (const room of this.rooms.values()) {
        room.flushPendingWrites();
      }
    }, FLUSH_INTERVAL_MS);

    console.log(`Game loop started at ${Math.round(1000 / SERVER_TICK_MS)}Hz`);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}
