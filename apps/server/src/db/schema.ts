import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export { user, session, account, verification } from "./auth-schema.js";

export const test = pgTable("test", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  score: integer("score"),
  createdAt: timestamp("created_at"),
});

export const playerItems = pgTable("player_items", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull(),
  itemId: text("item_id").notNull(),
  roomId: text("room_id").notNull(),
  pickedUpAt: timestamp("picked_up_at").notNull(),
});
