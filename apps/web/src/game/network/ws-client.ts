import { encodeMessage, decodeServerMessage } from "@my-beat/netcode/serializer";
import {
  ClientMsgType,
  ServerMsgType,
  type ClientPlayerInput,
  type ServerMessage,
  type GameSnapshot,
  type PlayerState,
} from "@my-beat/shared-types/messages";
import type { RegionId } from "@my-beat/shared-types/game-config";

export type GameClientCallbacks = {
  onJoined: (playerId: string, snapshot: GameSnapshot) => void;
  onSnapshot: (snapshot: GameSnapshot, lastProcessedInput: Record<string, number>) => void;
  onPlayerJoined: (player: PlayerState) => void;
  onPlayerLeft: (playerId: string) => void;
  onDisconnect: () => void;
};

export class GameClient {
  private ws: WebSocket | null = null;
  private seq = 0;
  playerId: string | null = null;
  private callbacks: GameClientCallbacks;

  constructor(callbacks: GameClientCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(region: RegionId): Promise<void> {
    // Ask matchmaking for a room in this region
    const mmRes = await fetch("/api/matchmaking/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region }),
    });
    if (!mmRes.ok) {
      console.error("Matchmaking failed");
      this.callbacks.onDisconnect();
      return;
    }
    const { wsUrl, roomId } = (await mmRes.json()) as { wsUrl: string; roomId: string };

    // Get auth token for the game server
    const tokenRes = await fetch("/api/game-token");
    if (!tokenRes.ok) {
      console.error("Failed to get game token — not authenticated");
      this.callbacks.onDisconnect();
      return;
    }
    const { token } = (await tokenRes.json()) as { token: string };

    const url = `${wsUrl}?token=${encodeURIComponent(token)}&roomId=${encodeURIComponent(roomId)}`;
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      console.log("Connected to game server");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const msg = decodeServerMessage(event.data as ArrayBuffer);
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      console.log("Disconnected from game server");
      this.callbacks.onDisconnect();
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }

  sendInput(inputFlags: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.seq++;
    const msg: ClientPlayerInput = {
      type: ClientMsgType.PLAYER_INPUT,
      seq: this.seq,
      inputFlags,
    };
    this.ws.send(encodeMessage(msg));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case ServerMsgType.ROOM_JOINED:
        this.playerId = msg.playerId;
        this.callbacks.onJoined(msg.playerId, msg.snapshot);
        break;
      case ServerMsgType.GAME_SNAPSHOT:
        this.callbacks.onSnapshot(msg.snapshot, msg.lastProcessedInput);
        break;
      case ServerMsgType.PLAYER_JOINED:
        this.callbacks.onPlayerJoined(msg.player);
        break;
      case ServerMsgType.PLAYER_LEFT:
        this.callbacks.onPlayerLeft(msg.playerId);
        break;
    }
  }
}
