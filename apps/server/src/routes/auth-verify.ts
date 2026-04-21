import { Hono } from "hono";
import { and, eq, gt } from "drizzle-orm";
import { auth } from "../lib/auth.js";
import { db } from "../db/index.js";
import { session as sessionTable, user as userTable } from "../db/auth-schema.js";

export const authVerifyRoute = new Hono();

authVerifyRoute.get("/", async (c) => {
  const token = c.req.query("token");

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
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({
      user: {
        id: rows[0].userId,
        name: rows[0].userName,
        email: rows[0].userEmail,
      },
    });
  }

  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!sessionData) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    user: {
      id: sessionData.user.id,
      name: sessionData.user.name,
      email: sessionData.user.email,
    },
  });
});
