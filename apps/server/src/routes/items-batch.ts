import { Hono } from "hono";
import { db } from "../db/index.js";
import { playerItems } from "../db/schema.js";

export const itemsBatchRoute = new Hono();

itemsBatchRoute.post("/", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    items?: Array<{
      playerId: string;
      itemId: string;
      roomId: string;
      pickedUpAt: number;
    }>;
  } | null;

  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return c.json({ error: "No items provided" }, 400);
  }

  try {
    await db.insert(playerItems).values(
      items.map((item) => ({
        playerId: item.playerId,
        itemId: item.itemId,
        roomId: item.roomId,
        pickedUpAt: new Date(item.pickedUpAt),
      })),
    );
    return c.json({ saved: items.length });
  } catch (e) {
    console.error("Failed to save items:", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});
