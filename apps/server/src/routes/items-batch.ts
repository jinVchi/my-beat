import { Body, Controller, Post, Res } from "@nestjs/common";
import { db } from "../db/index.js";
import { playerItems } from "../db/schema.js";
import type { StatusResponse } from "../lib/request.js";

type ItemsBatchBody = {
  items?: Array<{
    playerId: string;
    itemId: string;
    roomId: string;
    pickedUpAt: number;
  }>;
};

@Controller("api/items/batch")
export class ItemsBatchController {
  @Post()
  async saveBatch(
    @Body() body: ItemsBatchBody | null,
    @Res({ passthrough: true }) res: StatusResponse,
  ) {
    const items = body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400);
      return { error: "No items provided" };
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
      return { saved: items.length };
    } catch (e) {
      console.error("Failed to save items:", e);
      res.status(500);
      return { error: "Internal server error" };
    }
  }
}
