import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { GAME_SERVER_PORT, REGIONS } from "@my-beat/shared-types/game-config";
import type { RegionId } from "@my-beat/shared-types/game-config";
import {
  getSessionFromRequest,
  type RequestWithHeaders,
  type StatusResponse,
} from "../lib/request.js";

const VALID_REGIONS = new Set<RegionId>(["JP", "US", "EU"]);

type JoinMatchmakingBody = {
  region?: string;
};

@Controller("api/matchmaking")
export class MatchmakingController {
  @Post("join")
  async join(
    @Body() body: JoinMatchmakingBody | null,
    @Req() req: RequestWithHeaders,
    @Res({ passthrough: true }) res: StatusResponse,
  ) {
    const sessionData = await getSessionFromRequest(req);
    if (!sessionData) {
      res.status(401);
      return { error: "Unauthorized" };
    }

    const region = body?.region;
    if (!region || !VALID_REGIONS.has(region as RegionId)) {
      res.status(400);
      return { error: "Invalid region" };
    }

    const regionInfo = REGIONS.find((r) => r.id === region)!;

    const gsUrl = `http://localhost:${GAME_SERVER_PORT}/matchmaking/join`;
    const gsRes = await fetch(gsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region, userId: sessionData.user.id }),
    });

    if (!gsRes.ok) {
      res.status(502);
      return { error: "Game server unavailable" };
    }

    const { roomId } = (await gsRes.json()) as { roomId: string };

    return {
      wsUrl: regionInfo.wsUrl,
      roomId,
    };
  }
}
