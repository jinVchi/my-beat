import "dotenv/config";
import "reflect-metadata";
import type { IncomingMessage, ServerResponse } from "node:http";
import { NestFactory } from "@nestjs/core";
import { toNodeHandler } from "better-auth/node";
import { AppModule } from "./app.module.js";
import { auth } from "./lib/auth.js";

const PORT = Number(process.env.PORT ?? 3002);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3001";

type ExpressRequest = IncomingMessage & {
  originalUrl?: string;
};

function isBetterAuthRoute(req: ExpressRequest): boolean {
  const path = new URL(req.originalUrl ?? req.url ?? "/", "http://localhost").pathname;
  return path.startsWith("/api/auth/") && path !== "/api/auth/verify";
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const betterAuthHandler = toNodeHandler(auth);

  app.enableCors({
    origin: [WEB_ORIGIN],
    credentials: true,
  });

  app.use((req: ExpressRequest, res: ServerResponse, next: () => void) => {
    if (!isBetterAuthRoute(req)) {
      next();
      return;
    }

    void betterAuthHandler(req, res);
  });

  await app.listen(PORT);
  console.log(`Global server listening on http://localhost:${PORT}`);
}

void bootstrap();
