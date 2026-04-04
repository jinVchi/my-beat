import { auth } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { fromNodeHeaders } from "better-auth/node";
import { GAME_SERVER_PORT, REGIONS } from "@my-beat/shared-types/game-config";
import type { RegionId } from "@my-beat/shared-types/game-config";

const VALID_REGIONS = new Set<RegionId>(["JP", "US", "EU"]);

export default async function joinHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { region } = req.body as { region?: string };
  if (!region || !VALID_REGIONS.has(region as RegionId)) {
    return res.status(400).json({ error: "Invalid region" });
  }

  const regionInfo = REGIONS.find((r) => r.id === region)!;

  // Ask the game server to find or create a room for this region
  const gsUrl = `http://localhost:${GAME_SERVER_PORT}/matchmaking/join`;
  const gsRes = await fetch(gsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ region, userId: session.user.id }),
  });

  if (!gsRes.ok) {
    return res.status(502).json({ error: "Game server unavailable" });
  }

  const { roomId } = (await gsRes.json()) as { roomId: string };

  return res.status(200).json({
    wsUrl: regionInfo.wsUrl,
    roomId,
  });
}
