import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { playerItems } from "@/db/schema";

export default async function batchHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { items } = req.body as {
    items?: Array<{
      playerId: string;
      itemId: string;
      roomId: string;
      pickedUpAt: number;
    }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items provided" });
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
    return res.status(200).json({ saved: items.length });
  } catch (e) {
    console.error("Failed to save items:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
