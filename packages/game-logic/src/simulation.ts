import { SERVER_TICK_MS } from "@my-beat/shared-types/game-config";
import { RoomState } from "./types";
import { applyMovement } from "./movement";
import { tryStartAttack, tickAttackTimers, resolveAttackHits } from "./combat";
import { updateEnemies } from "./enemy-ai";

export function simulateTick(state: RoomState): RoomState {
  const deltaMs = SERVER_TICK_MS;
  let enemies = state.enemies;
  let players = new Map(state.players);

  for (const [id, player] of players) {
    let p = player;

    // Movement
    p = applyMovement(p, deltaMs);

    // Combat
    p = tryStartAttack(p);
    enemies = resolveAttackHits(p, enemies);
    p = tickAttackTimers(p, deltaMs);

    players.set(id, p);
  }

  // Enemy AI (can damage players)
  const result = updateEnemies(enemies, players, deltaMs);
  enemies = result.enemies;
  players = result.players;

  return {
    tick: state.tick + 1,
    players,
    enemies,
  };
}
