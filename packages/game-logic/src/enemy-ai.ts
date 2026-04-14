import {
  ENEMY_DETECT_RANGE_X,
  ENEMY_DETECT_RANGE_Y,
  ENEMY_ATTACK_RANGE_X,
  ENEMY_ATTACK_RANGE_Y,
  ENEMY_ATTACK_HITBOX_WIDTH,
  ENEMY_ATTACK_DAMAGE,
  ENEMY_WARNING_DURATION,
  ENEMY_ATTACK_DURATION,
  ENEMY_ATTACK_COOLDOWN,
  PLAYER_BODY_WIDTH,
  PLAYER_BODY_HEIGHT,
} from "@my-beat/shared-types/game-config";
import { SimEnemyState, SimPlayerState } from "./types";

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

function findNearestAlivePlayer(
  enemy: SimEnemyState,
  players: Map<string, SimPlayerState>,
): SimPlayerState | null {
  let nearest: SimPlayerState | null = null;
  let bestDist = Infinity;
  for (const p of players.values()) {
    if (p.health <= 0) continue;
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      nearest = p;
    }
  }
  return nearest;
}

export function updateEnemies(
  enemies: SimEnemyState[],
  players: Map<string, SimPlayerState>,
  deltaMs: number,
): { enemies: SimEnemyState[]; players: Map<string, SimPlayerState> } {
  const updatedPlayers = new Map(players);

  const nextEnemies = enemies.map((enemy) => {
    if (enemy.isDead) return enemy;

    let {
      warningTimer,
      attackTimer,
      attackCooldownTimer,
      isWarning,
      isAttacking,
    } = enemy;

    // Tick cooldown
    if (attackCooldownTimer > 0) {
      attackCooldownTimer = Math.max(0, attackCooldownTimer - deltaMs);
    }

    // Attacking state: tick down, single-frame hit on first tick already applied at transition
    if (isAttacking) {
      attackTimer -= deltaMs;
      if (attackTimer <= 0) {
        attackTimer = 0;
        isAttacking = false;
      }
      return {
        ...enemy,
        warningTimer,
        attackTimer,
        attackCooldownTimer,
        isWarning,
        isAttacking,
      };
    }

    // Warning state: tick down; when done, transition to attack and apply damage
    if (isWarning) {
      warningTimer -= deltaMs;
      if (warningTimer <= 0) {
        warningTimer = 0;
        isWarning = false;
        isAttacking = true;
        attackTimer = ENEMY_ATTACK_DURATION;
        attackCooldownTimer = ENEMY_ATTACK_COOLDOWN;

        // Apply damage to any player in hitbox
        for (const [id, p] of updatedPlayers) {
          if (p.health <= 0) continue;
          if (
            aabbOverlap(
              enemy.x,
              enemy.y,
              ENEMY_ATTACK_HITBOX_WIDTH,
              ENEMY_ATTACK_RANGE_Y * 2,
              p.x,
              p.y,
              PLAYER_BODY_WIDTH,
              PLAYER_BODY_HEIGHT,
            )
          ) {
            const newHealth = Math.max(0, p.health - ENEMY_ATTACK_DAMAGE);
            updatedPlayers.set(id, { ...p, health: newHealth });
          }
        }
      }
      return {
        ...enemy,
        warningTimer,
        attackTimer,
        attackCooldownTimer,
        isWarning,
        isAttacking,
      };
    }

    // Idle: look for target in detection range
    if (attackCooldownTimer <= 0) {
      const target = findNearestAlivePlayer(enemy, updatedPlayers);
      if (target) {
        const dx = Math.abs(target.x - enemy.x);
        const dy = Math.abs(target.y - enemy.y);
        if (dx <= ENEMY_DETECT_RANGE_X && dy <= ENEMY_DETECT_RANGE_Y) {
          isWarning = true;
          warningTimer = ENEMY_WARNING_DURATION;
        }
      }
    }

    return {
      ...enemy,
      warningTimer,
      attackTimer,
      attackCooldownTimer,
      isWarning,
      isAttacking,
    };
  });

  return { enemies: nextEnemies, players: updatedPlayers };
}
