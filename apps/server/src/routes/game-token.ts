import { Hono } from "hono";
import { auth } from "../lib/auth.js";

export const gameTokenRoute = new Hono();

gameTokenRoute.get("/", async (c) => {
  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!sessionData) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ token: sessionData.session.token });
});
