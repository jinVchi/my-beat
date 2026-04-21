CREATE TABLE "player_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"item_id" text NOT NULL,
	"room_id" text NOT NULL,
	"picked_up_at" timestamp NOT NULL
);
