import { WebSocketServer, WebSocket } from "ws";
import { nanoid } from "nanoid";
import { GAME_SERVER_PORT } from "@my-beat/shared-types/game-config";
import { ClientMsgType, ServerMsgType } from "@my-beat/shared-types/messages";
import { decodeClientMessage, encodeMessage } from "@my-beat/netcode/serializer";
import { GameLoop } from "./game-loop";

const gameLoop = new GameLoop();

// Create default room with Stage 1 enemy positions
gameLoop.createRoom("default", [
  { x: 500, y: 540 },
  { x: 700, y: 620 },
  { x: 850, y: 560 },
]);

const wss = new WebSocketServer({ port: GAME_SERVER_PORT });

const playerData = new Map<WebSocket, { playerId: string; roomId: string }>();

wss.on("connection", (ws) => {
  const playerId = nanoid(12);
  const roomId = "default";

  playerData.set(ws, { playerId, roomId });

  const room = gameLoop.getRoom(roomId);
  if (!room) {
    ws.close();
    return;
  }

  room.addPlayer(playerId, ws);
  console.log(
    `Player ${playerId} joined room ${roomId} (${room.playerCount} players)`,
  );

  ws.on("message", (data: Buffer) => {
    try {
      const msg = decodeClientMessage(data);
      const pd = playerData.get(ws);
      if (!pd) return;
      const r = gameLoop.getRoom(pd.roomId);
      if (!r) return;

      switch (msg.type) {
        case ClientMsgType.PLAYER_INPUT:
          r.queueInput(pd.playerId, msg);
          break;
        case ClientMsgType.PING:
          ws.send(
            encodeMessage({
              type: ServerMsgType.PONG,
              clientT: msg.t,
              serverT: Date.now(),
            }),
          );
          break;
      }
    } catch (e) {
      console.error("Failed to decode message:", e);
    }
  });

  ws.on("close", () => {
    const pd = playerData.get(ws);
    if (pd) {
      const r = gameLoop.getRoom(pd.roomId);
      if (r) {
        r.removePlayer(pd.playerId);
        console.log(
          `Player ${pd.playerId} left room ${pd.roomId} (${r.playerCount} players)`,
        );
      }
      playerData.delete(ws);
    }
  });
});

console.log(`Game server listening on ws://localhost:${GAME_SERVER_PORT}`);
gameLoop.start();
