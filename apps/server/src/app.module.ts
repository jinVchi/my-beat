import { Module } from "@nestjs/common";
import { AuthVerifyController } from "./routes/auth-verify.js";
import { GameTokenController } from "./routes/game-token.js";
import { HealthController } from "./routes/health.js";
import { ItemsBatchController } from "./routes/items-batch.js";
import { MatchmakingController } from "./routes/matchmaking.js";

@Module({
  controllers: [
    AuthVerifyController,
    GameTokenController,
    HealthController,
    ItemsBatchController,
    MatchmakingController,
  ],
})
export class AppModule {}
