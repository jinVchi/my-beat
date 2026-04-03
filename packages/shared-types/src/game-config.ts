// Player
export const PLAYER_SPEED = 200;
export const PLAYER_BODY_WIDTH = 40;
export const PLAYER_BODY_HEIGHT = 64;
export const PLAYER_HALF_HEIGHT = 32;
export const PLAYER_MAX_HEALTH = 100;

// Attack
export const ATTACK_DURATION = 200;
export const ATTACK_COOLDOWN = 400;
export const ATTACK_DAMAGE = 25;
export const ATTACK_RANGE_X = 60;
export const ATTACK_RANGE_Y = 30;
export const ATTACK_HITBOX_WIDTH = 50;

// Enemy
export const ENEMY_BODY_WIDTH = 40;
export const ENEMY_BODY_HEIGHT = 64;
export const ENEMY_DEFAULT_MAX_HEALTH = 100;

// World bounds
export const WORLD_WIDTH = 1024;
export const WORLD_HEIGHT = 768;
export const FLOOR_TOP = 450;
export const FLOOR_BOTTOM = 740;
export const WORLD_LEFT = 30;
export const WORLD_RIGHT = 994;

// Server
export const SERVER_TICK_RATE = 60;
export const SERVER_TICK_MS = 1000 / SERVER_TICK_RATE;
export const GAME_SERVER_PORT = 3002;

// Matchmaking
export const MAX_PLAYERS_PER_ROOM = 4;

// Regions
export type RegionId = "JP" | "US" | "EU";

export type RegionInfo = {
  id: RegionId;
  label: string;
  wsUrl: string;
};

export const REGIONS: RegionInfo[] = [
  { id: "JP", label: "Japan", wsUrl: `ws://localhost:${GAME_SERVER_PORT}` },
  { id: "US", label: "US West", wsUrl: `ws://localhost:${GAME_SERVER_PORT}` },
  { id: "EU", label: "Europe", wsUrl: `ws://localhost:${GAME_SERVER_PORT}` },
];
