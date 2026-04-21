import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth.js";
import { authVerifyRoute } from "./routes/auth-verify.js";
import { gameTokenRoute } from "./routes/game-token.js";
import { matchmakingRoute } from "./routes/matchmaking.js";
import { itemsBatchRoute } from "./routes/items-batch.js";

const PORT = Number(process.env.PORT ?? 3002);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3001";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [WEB_ORIGIN],
    credentials: true,
  }),
);

// Our verify route sits above Better Auth's catch-all
app.route("/api/auth/verify", authVerifyRoute);

// Better Auth handles everything else under /api/auth/*
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/game-token", gameTokenRoute);
app.route("/api/matchmaking", matchmakingRoute);
app.route("/api/items/batch", itemsBatchRoute);

app.get("/health", (c) => c.json({ ok: true }));

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Global server listening on http://localhost:${info.port}`);
});
