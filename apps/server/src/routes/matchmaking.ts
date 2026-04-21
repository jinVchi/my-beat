import { Hono } from "hono";
import { auth } from "../lib/auth.js";
import { GAME_SERVER_PORT, REGIONS } from "@my-beat/shared-types/game-config";
import type { RegionId } from "@my-beat/shared-types/game-config";

const VALID_REGIONS = new Set<RegionId>(["JP", "US", "EU"]);

export const matchmakingRoute = new Hono();

matchmakingRoute.post("/join", async (c) => {
  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!sessionData) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = (await c.req.json().catch(() => null)) as { region?: string } | null;
  const region = body?.region;
  if (!region || !VALID_REGIONS.has(region as RegionId)) {
    return c.json({ error: "Invalid region" }, 400);
  }

  const regionInfo = REGIONS.find((r) => r.id === region)!;

  const gsUrl = `http://localhost:${GAME_SERVER_PORT}/matchmaking/join`;
  const gsRes = await fetch(gsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ region, userId: sessionData.user.id }),
  });

  if (!gsRes.ok) {
    return c.json({ error: "Game server unavailable" }, 502);
  }

  const { roomId } = (await gsRes.json()) as { roomId: string };

  return c.json({
    wsUrl: regionInfo.wsUrl,
    roomId,
  });
});
