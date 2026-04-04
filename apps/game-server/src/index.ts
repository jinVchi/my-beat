import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GAME_SERVER_PORT } from "@my-beat/shared-types/game-config";
import type { RegionId } from "@my-beat/shared-types/game-config";
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

const VALID_REGIONS = new Set<RegionId>(["JP", "US", "EU"]);

const gameLoop = new GameLoop();

const playerData = new Map<WebSocket, { playerId: string; roomId: string }>();
const verifiedUsers = new Map<string, VerifiedUser>();

// --------------- HTTP endpoints ---------------

function handleHttp(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", `http://localhost:${GAME_SERVER_PORT}`);

  if (req.method === "GET" && url.pathname === "/rooms") {
    const region = url.searchParams.get("region") as RegionId | null;
    const rooms = gameLoop.listRooms(region ?? undefined);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ rooms }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/matchmaking/join") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { region, userId } = JSON.parse(body) as { region: string; userId: string };
        if (!VALID_REGIONS.has(region as RegionId)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid region" }));
          return;
        }
        if (!userId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing userId" }));
          return;
        }
        const room = gameLoop.findOrCreateRoom(region as RegionId, userId);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ roomId: room.id }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Bad request" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
}

// --------------- WebSocket ---------------

const server = createServer(handleHttp);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", async (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://localhost:${GAME_SERVER_PORT}`);
  const token = url.searchParams.get("token");
  const roomId = url.searchParams.get("roomId");

  if (!token || !roomId) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
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

  const room = gameLoop.getRoom(roomId);
  if (!room) {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    verifiedUsers.set(user.id, user);
    wss.emit("connection", ws, user, roomId);
  });
});

wss.on("connection", (ws: WebSocket, user: VerifiedUser, roomId: string) => {
  const playerId = user.id;

  // Evict any existing connection for the same player
  for (const [existingWs, pd] of playerData) {
    if (pd.playerId === playerId) {
      playerData.delete(existingWs);
      // The room will close the old WS inside addPlayer
      break;
    }
  }

  const room = gameLoop.getRoom(roomId)!;
  const added = room.addPlayer(playerId, ws);
  if (!added) {
    ws.close(4002, "Room is full");
    return;
  }

  playerData.set(ws, { playerId, roomId });
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
        r.releaseSlot(pd.playerId);
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
