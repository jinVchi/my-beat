import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { session as sessionTable, user as userTable } from "../db/auth-schema.js";
import {
  getSessionFromRequest,
  type RequestWithHeaders,
  type StatusResponse,
} from "../lib/request.js";

@Controller("api/auth/verify")
export class AuthVerifyController {
  @Get()
  async verify(
    @Query("token") token: string | undefined,
    @Req() req: RequestWithHeaders,
    @Res({ passthrough: true }) res: StatusResponse,
  ) {
    if (token) {
      const rows = await db
        .select({
          userId: sessionTable.userId,
          userName: userTable.name,
          userEmail: userTable.email,
        })
        .from(sessionTable)
        .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
        .where(
          and(
            eq(sessionTable.token, token),
            gt(sessionTable.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (rows.length === 0) {
        res.status(401);
        return { error: "Unauthorized" };
      }

      return {
        user: {
          id: rows[0].userId,
          name: rows[0].userName,
          email: rows[0].userEmail,
        },
      };
    }

    const sessionData = await getSessionFromRequest(req);

    if (!sessionData) {
      res.status(401);
      return { error: "Unauthorized" };
    }

    return {
      user: {
        id: sessionData.user.id,
        name: sessionData.user.name,
        email: sessionData.user.email,
      },
    };
  }
}
