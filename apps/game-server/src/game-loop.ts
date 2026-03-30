import { SERVER_TICK_MS } from "@my-beat/shared-types/game-config";
import { Room } from "./room";

export class GameLoop {
  private rooms = new Map<string, Room>();
  private interval: ReturnType<typeof setInterval> | null = null;

  createRoom(
    id: string,
    enemies: Array<{ x: number; y: number }>,
  ): Room {
    const room = new Room(id, enemies);
    this.rooms.set(id, room);
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  start(): void {
    this.interval = setInterval(() => {
      for (const room of this.rooms.values()) {
        room.tick();
      }
    }, SERVER_TICK_MS);

    console.log(`Game loop started at ${Math.round(1000 / SERVER_TICK_MS)}Hz`);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
