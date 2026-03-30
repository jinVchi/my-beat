import {
  ATTACK_DURATION,
  ATTACK_COOLDOWN,
  ATTACK_DAMAGE,
  ATTACK_RANGE_X,
  ATTACK_RANGE_Y,
  ATTACK_HITBOX_WIDTH,
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
  ENEMY_BODY_WIDTH,
  ENEMY_BODY_HEIGHT,
} from "@my-beat/shared-types/game-config";
import { InputFlag } from "@my-beat/shared-types/messages";
import { SimPlayerState, SimEnemyState } from "./types";

export function tryStartAttack(player: SimPlayerState): SimPlayerState {
  if (
    player.inputFlags & InputFlag.ATTACK &&
    !player.isAttacking &&
    player.attackCooldownTimer <= 0
  ) {
    return {
      ...player,
      isAttacking: true,
      attackTimer: ATTACK_DURATION,
      attackCooldownTimer: ATTACK_COOLDOWN,
    };
  }
  return player;
}

export function tickAttackTimers(
  player: SimPlayerState,
  deltaMs: number,
): SimPlayerState {
  let { attackTimer, attackCooldownTimer, isAttacking } = player;

  if (attackTimer > 0) {
    attackTimer -= deltaMs;
    if (attackTimer <= 0) {
      attackTimer = 0;
      isAttacking = false;
    }
  }

  if (attackCooldownTimer > 0) {
    attackCooldownTimer -= deltaMs;
    if (attackCooldownTimer <= 0) {
      attackCooldownTimer = 0;
    }
  }

  return { ...player, attackTimer, attackCooldownTimer, isAttacking };
}

function aabbOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return (
    ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    ay - ah / 2 < by + bh / 2 &&
    ay + ah / 2 > by - bh / 2
  );
}

export function resolveAttackHits(
  player: SimPlayerState,
  enemies: SimEnemyState[],
): SimEnemyState[] {
  // Only check on the first tick of an attack
  if (!player.isAttacking || player.attackTimer !== ATTACK_DURATION) {
    return enemies;
  }

  const hitboxX = player.facingRight
    ? player.x + ATTACK_RANGE_X
    : player.x - ATTACK_RANGE_X;
  const hitboxY = player.y;

  return enemies.map((enemy) => {
    if (enemy.isDead) return enemy;

    if (
      aabbOverlap(
        hitboxX,
        hitboxY,
        ATTACK_HITBOX_WIDTH,
        ATTACK_RANGE_Y * 2,
        enemy.x,
        enemy.y,
        ENEMY_BODY_WIDTH,
        ENEMY_BODY_HEIGHT,
      )
    ) {
      const newHealth = Math.max(0, enemy.health - ATTACK_DAMAGE);
      return {
        ...enemy,
        health: newHealth,
        isDead: newHealth <= 0,
      };
    }
    return enemy;
  });
}
