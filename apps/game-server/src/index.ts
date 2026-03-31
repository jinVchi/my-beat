import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GAME_SERVER_PORT } from "@my-beat/shared-types/game-config";
import { ClientMsgType, ServerMsgType } from "@my-beat/shared-types/messages";
import { decodeClientMessage, encodeMessage } from "@my-beat/netcode/serializer";
import { GameLoop } from "./game-loop";

const AUTH_VERIFY_URL =
  process.env.AUTH_VERIFY_URL ?? "http://localhost:3001/api/auth/verify";

type VerifiedUser = { id: string; name: string; email: string };

async function verifyToken(token: string): Promise<VerifiedUser | null> {
  try {
    const res = await fetch(`${AUTH_VERIFY_URL}?token=${encodeURIComponent(token)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { user: VerifiedUser };
    return data.user;
  } catch {
    return null;
  }
}

const gameLoop = new GameLoop();

// Create default room with Stage 1 enemy positions
gameLoop.createRoom("default", [
  { x: 500, y: 540 },
  { x: 700, y: 620 },
  { x: 850, y: 560 },
]);

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

const playerData = new Map<WebSocket, { playerId: string; roomId: string }>();

// Cache verified users by their user ID
const verifiedUsers = new Map<string, VerifiedUser>();

server.on("upgrade", async (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://localhost:${GAME_SERVER_PORT}`);
  const token = url.searchParams.get("token");

  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const user = await verifyToken(token);
  if (!user) {
    console.log("Auth verification failed for token:", token.slice(0, 8) + "...");
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    verifiedUsers.set(user.id, user);
    wss.emit("connection", ws, user);
  });
});

wss.on("connection", (ws: WebSocket, user: VerifiedUser) => {
  const playerId = user.id;
  const roomId = "default";

  playerData.set(ws, { playerId, roomId });

  const room = gameLoop.getRoom(roomId);
  if (!room) {
    ws.close();
    return;
  }

  room.addPlayer(playerId, ws);
  console.log(
    `Player ${user.name} (${playerId}) joined room ${roomId} (${room.playerCount} players)`,
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
      verifiedUsers.delete(pd.playerId);
      playerData.delete(ws);
    }
  });
});

server.listen(GAME_SERVER_PORT, () => {
  console.log(`Game server listening on ws://localhost:${GAME_SERVER_PORT}`);
});
gameLoop.start();
