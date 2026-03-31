import { auth } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "@/db";
import { session as sessionTable, user as userTable } from "@/db/auth-schema";
import { eq, and, gt } from "drizzle-orm";

export default async function verifyHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Support token-based verification (used by game server)
  const token = req.query.token as string | undefined;

  if (token) {
    // Direct DB lookup for game server token verification
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
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.status(200).json({
      user: {
        id: rows[0].userId,
        name: rows[0].userName,
        email: rows[0].userEmail,
      },
    });
  }

  // Cookie-based verification (used by browser)
  const sessionData = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!sessionData) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.status(200).json({
    user: {
      id: sessionData.user.id,
      name: sessionData.user.name,
      email: sessionData.user.email,
    },
  });
}
