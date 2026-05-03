import {
  ATTACK_DURATION,
  ATTACK_COOLDOWN,
  ATTACK_DAMAGE,
  ATTACK_RANGE_X,
  ATTACK_RANGE_Y,
  ATTACK_HITBOX_WIDTH,
  HEAVY_ATTACK_DURATION,
  HEAVY_ATTACK_COOLDOWN,
  HEAVY_ATTACK_DAMAGE,
  HEAVY_ATTACK_RANGE_X,
  HEAVY_ATTACK_RANGE_Y,
  HEAVY_ATTACK_HITBOX_WIDTH,
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
  ENEMY_BODY_WIDTH,
  ENEMY_BODY_HEIGHT,
} from "@my-beat/shared-types/game-config";
import { AttackType, InputFlag } from "@my-beat/shared-types/messages";
import type { AttackType as AttackTypeValue } from "@my-beat/shared-types/messages";
import { SimPlayerState, SimEnemyState } from "./types";

type AttackConfig = {
  duration: number;
  cooldown: number;
  damage: number;
  rangeX: number;
  rangeY: number;
  hitboxWidth: number;
};

function getAttackConfig(attackType: AttackTypeValue): AttackConfig {
  if (attackType === AttackType.HEAVY) {
    return {
      duration: HEAVY_ATTACK_DURATION,
      cooldown: HEAVY_ATTACK_COOLDOWN,
      damage: HEAVY_ATTACK_DAMAGE,
      rangeX: HEAVY_ATTACK_RANGE_X,
      rangeY: HEAVY_ATTACK_RANGE_Y,
      hitboxWidth: HEAVY_ATTACK_HITBOX_WIDTH,
    };
  }

  return {
    duration: ATTACK_DURATION,
    cooldown: ATTACK_COOLDOWN,
    damage: ATTACK_DAMAGE,
    rangeX: ATTACK_RANGE_X,
    rangeY: ATTACK_RANGE_Y,
    hitboxWidth: ATTACK_HITBOX_WIDTH,
  };
}

function getRequestedAttackType(inputFlags: number): AttackTypeValue | null {
  if (inputFlags & InputFlag.HEAVY_ATTACK) return AttackType.HEAVY;
  if (inputFlags & InputFlag.ATTACK) return AttackType.LIGHT;
  return null;
}

export function tryStartAttack(player: SimPlayerState): SimPlayerState {
  const attackType = getRequestedAttackType(player.inputFlags);
  if (
    attackType !== null &&
    !player.isAttacking &&
    player.attackCooldownTimer <= 0
  ) {
    const config = getAttackConfig(attackType);
    return {
      ...player,
      isAttacking: true,
      attackType,
      attackTimer: config.duration,
      attackCooldownTimer: config.cooldown,
    };
  }
  return player;
}

export function tickAttackTimers(
  player: SimPlayerState,
  deltaMs: number,
): SimPlayerState {
  let { attackTimer, attackCooldownTimer, attackType, isAttacking } = player;

  if (attackTimer > 0) {
    attackTimer -= deltaMs;
    if (attackTimer <= 0) {
      attackTimer = 0;
      isAttacking = false;
      attackType = null;
    }
  }

  if (attackCooldownTimer > 0) {
    attackCooldownTimer -= deltaMs;
    if (attackCooldownTimer <= 0) {
      attackCooldownTimer = 0;
    }
  }

  return {
    ...player,
    attackTimer,
    attackCooldownTimer,
    attackType,
    isAttacking,
  };
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
  if (!player.attackType) {
    return enemies;
  }

  const config = getAttackConfig(player.attackType);

  // Only check on the first tick of an attack
  if (!player.isAttacking || player.attackTimer !== config.duration) {
    return enemies;
  }

  const hitboxX = player.facingRight
    ? player.x + config.rangeX
    : player.x - config.rangeX;
  const hitboxY = player.y;

  return enemies.map((enemy) => {
    if (enemy.isDead) return enemy;

    if (
      aabbOverlap(
        hitboxX,
        hitboxY,
        config.hitboxWidth,
        config.rangeY * 2,
        enemy.x,
        enemy.y,
        ENEMY_BODY_WIDTH,
        ENEMY_BODY_HEIGHT,
      )
    ) {
      const newHealth = Math.max(0, enemy.health - config.damage);
      return {
        ...enemy,
        health: newHealth,
        isDead: newHealth <= 0,
      };
    }
    return enemy;
  });
}
