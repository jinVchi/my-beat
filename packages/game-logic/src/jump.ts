import {
  JUMP_DURATION,
  JUMP_HEIGHT,
} from "@my-beat/shared-types/game-config";
import { InputFlag } from "@my-beat/shared-types/messages";
import type { SimPlayerState } from "./types";

export function updateJump(
  player: SimPlayerState,
  deltaMs: number,
): SimPlayerState {
  let { isJumping, jumpTimer } = player;

  if ((player.inputFlags & InputFlag.JUMP) && !isJumping) {
    isJumping = true;
    jumpTimer = JUMP_DURATION;
  }

  if (!isJumping) {
    return { ...player, isJumping: false, jumpTimer: 0, jumpOffset: 0 };
  }

  jumpTimer = Math.max(0, jumpTimer - deltaMs);
  if (jumpTimer <= 0) {
    return { ...player, isJumping: false, jumpTimer: 0, jumpOffset: 0 };
  }

  const progress = 1 - jumpTimer / JUMP_DURATION;
  const jumpOffset = Math.sin(progress * Math.PI) * JUMP_HEIGHT;

  return {
    ...player,
    isJumping,
    jumpTimer,
    jumpOffset,
  };
}
