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

export const HEAVY_ATTACK_DURATION = 350;
export const HEAVY_ATTACK_COOLDOWN = 650;
export const HEAVY_ATTACK_DAMAGE = 40;
export const HEAVY_ATTACK_RANGE_X = 70;
export const HEAVY_ATTACK_RANGE_Y = 34;
export const HEAVY_ATTACK_HITBOX_WIDTH = 64;

// Jump is rendered as vertical lift above the beat'em-up floor lane.
export const JUMP_DURATION = 520;
export const JUMP_HEIGHT = 78;

// Enemy
export const ENEMY_BODY_WIDTH = 40;
export const ENEMY_BODY_HEIGHT = 64;
export const ENEMY_DEFAULT_MAX_HEALTH = 100;

// Enemy attack AI
export const ENEMY_DETECT_RANGE_X = 90;
export const ENEMY_DETECT_RANGE_Y = 50;
export const ENEMY_ATTACK_RANGE_X = 60;
export const ENEMY_ATTACK_RANGE_Y = 40;
export const ENEMY_ATTACK_HITBOX_WIDTH = 70;
export const ENEMY_ATTACK_DAMAGE = 10;
export const ENEMY_WARNING_DURATION = 900; // ms — 3 yellow flashes
export const ENEMY_WARNING_FLASHES = 3;
export const ENEMY_ATTACK_DURATION = 200;
export const ENEMY_ATTACK_COOLDOWN = 1800;

// World bounds
export const WORLD_WIDTH = 2048;
export const WORLD_HEIGHT = 768;
export const FLOOR_TOP = 450;
export const FLOOR_BOTTOM = 740;
export const WORLD_LEFT = 30;
export const WORLD_RIGHT = WORLD_WIDTH - 30;

// Stages
export const STAGES = [
  {
    id: 1,
    name: "Downtown Stretch",
    skyColor: 0x4488cc,
    skylineColor: 0x334455,
    streetColor: 0x666655,
    floorColor: 0x888877,
    floorHighlightColor: 0x999988,
    hasExit: true,
    enemies: [
      { x: 720, y: 540 },
      { x: 1040, y: 620 },
      { x: 1440, y: 560 },
    ],
  },
  {
    id: 2,
    name: "Neon Backstreet",
    skyColor: 0x2b2240,
    skylineColor: 0x1f3f4a,
    streetColor: 0x2d3238,
    floorColor: 0x3f5060,
    floorHighlightColor: 0x6fb6c8,
    hasExit: false,
    enemies: [
      { x: 560, y: 530 },
      { x: 820, y: 630 },
      { x: 1080, y: 560 },
      { x: 1360, y: 650 },
      { x: 1640, y: 575 },
    ],
  },
] as const;

export type StageId = (typeof STAGES)[number]["id"];
export type StageConfig = (typeof STAGES)[number];

export const DEFAULT_STAGE_ID: StageId = 1;

export function getStageConfig(stageId: StageId): StageConfig {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0];
}

// Server
export const SERVER_TICK_RATE = 60;
export const SERVER_TICK_MS = 1000 / SERVER_TICK_RATE;
export const GAME_SERVER_PORT = 3003;

// Matchmaking
export const MAX_PLAYERS_PER_ROOM = 4;

// Items
export type ItemId = "item_a" | "item_b" | "item_c";
export const ITEM_IDS: ItemId[] = ["item_a", "item_b", "item_c"];
export const ITEM_PICKUP_RANGE = 50;

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
