import { Controller, Get, Req, Res } from "@nestjs/common";
import {
  getSessionFromRequest,
  type RequestWithHeaders,
  type StatusResponse,
} from "../lib/request.js";

@Controller("api/game-token")
export class GameTokenController {
  @Get()
  async getToken(
    @Req() req: RequestWithHeaders,
    @Res({ passthrough: true }) res: StatusResponse,
  ) {
    const sessionData = await getSessionFromRequest(req);

    if (!sessionData) {
      res.status(401);
      return { error: "Unauthorized" };
    }

    return { token: sessionData.session.token };
  }
}
