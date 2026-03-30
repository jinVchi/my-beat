import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const test = pgTable("test", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  score: integer("score"),
  createdAt: timestamp("created_at"),
});
