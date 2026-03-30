import {
  PLAYER_SPEED,
  PLAYER_HALF_HEIGHT,
  FLOOR_TOP,
  FLOOR_BOTTOM,
  WORLD_LEFT,
  WORLD_RIGHT,
} from "@my-beat/shared-types/game-config";
import { InputFlag } from "@my-beat/shared-types/messages";
import { SimPlayerState } from "./types";

export function applyMovement(
  player: SimPlayerState,
  deltaMs: number,
): SimPlayerState {
  let vx = 0;
  let vy = 0;

  if (player.inputFlags & InputFlag.LEFT) {
    vx = -PLAYER_SPEED;
  } else if (player.inputFlags & InputFlag.RIGHT) {
    vx = PLAYER_SPEED;
  }

  if (player.inputFlags & InputFlag.UP) {
    vy = -PLAYER_SPEED;
  } else if (player.inputFlags & InputFlag.DOWN) {
    vy = PLAYER_SPEED;
  }

  // Normalize diagonal movement
  if (vx !== 0 && vy !== 0) {
    const factor = Math.SQRT1_2;
    vx *= factor;
    vy *= factor;
  }

  let facingRight = player.facingRight;
  if (player.inputFlags & InputFlag.LEFT) {
    facingRight = false;
  } else if (player.inputFlags & InputFlag.RIGHT) {
    facingRight = true;
  }

  const dt = deltaMs / 1000;
  let x = player.x + vx * dt;
  let y = player.y + vy * dt;

  // Clamp to world bounds
  if (y - PLAYER_HALF_HEIGHT < FLOOR_TOP) y = FLOOR_TOP + PLAYER_HALF_HEIGHT;
  if (y + PLAYER_HALF_HEIGHT > FLOOR_BOTTOM)
    y = FLOOR_BOTTOM - PLAYER_HALF_HEIGHT;
  if (x < WORLD_LEFT) x = WORLD_LEFT;
  if (x > WORLD_RIGHT) x = WORLD_RIGHT;

  return { ...player, x, y, facingRight };
}
